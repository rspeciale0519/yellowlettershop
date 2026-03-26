/**
 * Payment Intent Service
 * Handles payment intent creation, capture, and refunds
 */

import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from './stripe-config';
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
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

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

      // Log transaction in database
      const { error: transactionError } = await this.supabase
        .from('payment_transactions')
        .insert({
          stripe_payment_intent_id: paymentIntent.id,
          user_id: userId,
          campaign_id: campaignId,
          amount,
          currency,
          status: 'pending' as PaymentStatus,
          metadata: {
            description,
            ...metadata,
          },
        });

      if (transactionError) {
        console.error('Failed to log payment transaction:', transactionError);
        // Don't throw error here as payment intent was created successfully
      }

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
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    const { paymentIntentId, amount, metadata = {} } = params;

    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: amount,
        metadata,
      });

      // Update transaction in database
      const { error: updateError } = await this.supabase
        .from('payment_transactions')
        .update({
          status: 'captured' as PaymentStatus,
          captured_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('Failed to update payment transaction:', updateError);
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        status: this.mapStripeStatus(paymentIntent.status),
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
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    const { paymentIntentId, amount, reason = 'requested_by_customer', metadata = {} } = params;

    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
        metadata,
      });

      // Update transaction in database
      const { error: updateError } = await this.supabase
        .from('payment_transactions')
        .update({
          status: 'refunded' as PaymentStatus,
          refunded_at: new Date().toISOString(),
          refund_amount: refund.amount,
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('Failed to update refund transaction:', updateError);
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
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

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