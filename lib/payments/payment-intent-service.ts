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
  RefundPaymentParams
} from './types';
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

      // Persist inline on the order. Stripe reports CENTS; orders store DOLLARS
      // — this is the only place that conversion happens.
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
        console.error('Failed to record capture on order:', updateError);
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
  async refundPayment(params: RefundPaymentParams): Promise<Stripe.Refund> {
    const stripe = requireStripe();

    const { paymentIntentId, amount, reason = 'requested_by_customer', metadata = {} } = params;

    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
        metadata,
      });

      // Persist inline on the order (Stripe cents → dollars).
      const { error: updateError } = await this.supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          amount_refunded: refund.amount / 100,
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('Failed to record refund on order:', updateError);
      }

      return refund;
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