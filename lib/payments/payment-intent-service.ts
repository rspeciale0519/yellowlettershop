/**
 * Payment Intent Service
 * Handles payment intent creation, capture, and refunds
 */

import Stripe from 'stripe';
import { requireStripe, STRIPE_CONFIG } from './stripe-config';
import { createServiceClient } from '@/utils/supabase/service';
import { CustomerService } from './customer-service';
import {
  PaymentServiceError,
  PaymentIntent,
  CreatePaymentIntentParams,
  CapturePaymentParams,
  RefundPaymentParams,
  RefundOutcome
} from './types';
import { resolveRefundState } from './refund-core';
import type { PaymentStatus } from '@/types/supabase';

export class PaymentIntentService {
  private supabase = createServiceClient();
  private customerService = new CustomerService();

  /**
   * Create payment intent for order authorization
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const stripe = requireStripe();

    const {
      userId,
      amount,
      currency = STRIPE_CONFIG.currency,
      description,
      campaignId,
      metadata = {},
      automaticPaymentMethods = true,
    } = params;

    // Ensure customer exists
    const customerId = await this.customerService.ensureCustomer(userId);

    try {
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        description,
        capture_method: STRIPE_CONFIG.captureMethod,
        automatic_payment_methods: automaticPaymentMethods
          ? { enabled: true }
          : undefined,
        metadata: {
          userId,
          campaignId: campaignId || '',
          ...metadata,
        },
      });

      // No DB write here by design: the intent is created BEFORE the order row
      // exists (the wizard authorizes, then submits). The PaymentIntent id is
      // recorded on the order at submit time (lib/orders/order-insert.ts), which
      // is what capture/refund below key off.

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        status: this.mapStripeStatus(paymentIntent.status),
        customerId,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to create payment intent',
          'STRIPE_PAYMENT_INTENT_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Capture payment intent (complete the payment)
   */
  async capturePayment(params: CapturePaymentParams): Promise<PaymentIntent> {
    const stripe = requireStripe();

    const { paymentIntentId, amount, metadata = {} } = params;

    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: amount,
        metadata,
      });

      // Persist inline on the order. Stripe reports CENTS; orders store
      // DOLLARS — converted only at the Stripe boundaries in this file
      // (capture here, refund below).
      const amountReceived =
        typeof paymentIntent.amount_received === 'number'
          ? paymentIntent.amount_received / 100
          : null;

      const { error: updateError } = await this.supabase
        .from('orders')
        .update({
          payment_status: 'captured',
          amount_captured: amountReceived,
          captured_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        // These columns are the SOLE record of payment state — swallowing this
        // would let the DB silently diverge from Stripe (money moved, nothing
        // recorded). Throw so the caller surfaces it; the Stripe-side capture
        // is idempotent to retry, and the webhook reconcile is a backstop.
        throw new PaymentServiceError(
          `Payment captured on Stripe but recording it failed: ${updateError.message}`,
          'CAPTURE_RECORD_ERROR',
          500
        );
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        status: this.mapStripeStatus(paymentIntent.status),
        amountReceived,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to capture payment',
          'STRIPE_CAPTURE_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(params: RefundPaymentParams): Promise<RefundOutcome> {
    const stripe = requireStripe();

    const { paymentIntentId, amount, reason = 'requested_by_customer', metadata = {} } = params;

    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
        metadata,
      });

      // amount_refunded is cumulative, so read before writing: Stripe allows
      // several partial refunds against one PaymentIntent and reports only the
      // latest one's amount.
      const { data: current, error: readError } = await this.supabase
        .from('orders')
        .select('amount_captured, amount_refunded')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle();

      if (readError) {
        throw new PaymentServiceError(
          `Refund issued on Stripe but reading the order to record it failed: ${readError.message}`,
          'REFUND_RECORD_ERROR',
          500
        );
      }

      const row = current as {
        amount_captured?: number | null;
        amount_refunded?: number | null;
      } | null;

      const { totalRefunded, isFullRefund } = resolveRefundState({
        previouslyRefunded: row?.amount_refunded,
        amountCaptured: row?.amount_captured,
        refundCents: refund.amount,
      });

      // Persist inline on the order (Stripe cents → dollars). payment_status
      // only flips once everything captured has been returned — a partial stays
      // 'captured' so the remainder is still refundable and the admin list does
      // not call a $1 refund on a $100 order a refunded order.
      const { error: updateError } = await this.supabase
        .from('orders')
        .update({
          ...(isFullRefund ? { payment_status: 'refunded' as PaymentStatus } : {}),
          amount_refunded: totalRefunded,
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        // Refunds have NO webhook backstop — a swallowed failure here would
        // diverge the DB from Stripe permanently. Surface it loudly.
        throw new PaymentServiceError(
          `Refund issued on Stripe but recording it failed: ${updateError.message}`,
          'REFUND_RECORD_ERROR',
          500
        );
      }

      return { refund, totalRefunded, isFullRefund };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to process refund',
          'STRIPE_REFUND_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = requireStripe();

    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to retrieve payment intent',
          'STRIPE_PAYMENT_INTENT_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Map Stripe status to our payment status
   */
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'pending';
      case 'requires_capture':
        return 'authorized';
      case 'succeeded':
        return 'captured';
      case 'canceled':
        return 'failed';
      default:
        return 'pending';
    }
  }
}