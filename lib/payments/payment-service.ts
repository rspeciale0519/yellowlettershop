/**
 * Payment Service Layer
 * 
 * Provides comprehensive payment processing functionality including:
 * - Payment authorization and capture
 * - Subscription management
 * - Payment method management  
 * - Transaction logging and audit trail
 */

import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG, SUBSCRIPTION_PLANS, USAGE_PRICING } from './stripe-config';
import { createServiceClient } from '@/utils/supabase/service';
import type { 
  PaymentStatus, 
  SubscriptionPlan, 
  UserProfile,
  PaymentTransaction 
} from '@/types/supabase-comprehensive';

// Payment service errors
export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: PaymentStatus;
  customerId?: string;
}

export interface PaymentMethodData {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface SubscriptionData {
  id: string;
  status: string;
  plan: SubscriptionPlan;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
}

/**
 * Main Payment Service Class
 */
export class PaymentService {
  private supabase = createServiceClient();

  /**
   * Create or retrieve Stripe customer for user
   */
  async ensureCustomer(userId: string, userEmail?: string): Promise<string> {
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    // Get user profile to check existing customer ID
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new PaymentServiceError(
        'Failed to retrieve user profile',
        'PROFILE_RETRIEVAL_ERROR',
        500,
        profileError
      );
    }

    // Return existing customer ID if available
    if (profile.stripe_customer_id) {
      return profile.stripe_customer_id;
    }

    // Get user email if not provided
    let email = userEmail;
    if (!email) {
      const { data: authUser, error: authError } = await this.supabase.auth.admin.getUserById(userId);
      if (authError || !authUser.user?.email) {
        throw new PaymentServiceError(
          'Failed to retrieve user email',
          'EMAIL_RETRIEVAL_ERROR',
          500,
          authError
        );
      }
      email = authUser.user.email;
    }

    try {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: profile.full_name || undefined,
        metadata: {
          userId,
          source: 'yellowlettershop',
        },
      });

      // Update user profile with customer ID
      const { error: updateError } = await this.supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', userId);

      if (updateError) {
        throw new PaymentServiceError(
          'Failed to update user profile with customer ID',
          'PROFILE_UPDATE_ERROR',
          500,
          updateError
        );
      }

      return customer.id;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Stripe customer creation failed',
          'STRIPE_CUSTOMER_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Create payment intent for order authorization
   */
  async createPaymentIntent(params: {
    userId: string;
    amount: number; // Amount in cents
    currency?: string;
    description: string;
    campaignId?: string;
    metadata?: Record<string, string>;
    automaticPaymentMethods?: boolean;
  }): Promise<PaymentIntent> {
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
    const customerId = await this.ensureCustomer(userId);

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
        payment_method_types: automaticPaymentMethods 
          ? undefined 
          : STRIPE_CONFIG.paymentMethodTypes,
        metadata: {
          userId,
          campaignId: campaignId || '',
          source: 'yellowlettershop',
          ...metadata,
        },
      });

      // Create payment transaction record
      const { error: transactionError } = await this.supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          campaign_id: campaignId || null,
          stripe_payment_intent_id: paymentIntent.id,
          amount: amount / 100, // Convert cents to dollars
          currency,
          status: 'pending' as PaymentStatus,
          metadata: {
            description,
            customerId,
            ...metadata,
          },
        });

      if (transactionError) {
        // Log error but don't fail the payment intent creation
        console.error('Failed to create payment transaction record:', transactionError);
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount,
        status: 'pending' as PaymentStatus,
        customerId,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Payment intent creation failed',
          'PAYMENT_INTENT_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Capture authorized payment
   */
  async capturePayment(
    paymentIntentId: string,
    captureAmount?: number
  ): Promise<void> {
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    try {
      // Capture the payment
      const paymentIntent = await stripe.paymentIntents.capture(
        paymentIntentId,
        captureAmount ? { amount_to_capture: captureAmount } : undefined
      );

      // Update payment transaction record
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
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        // Update transaction status to failed
        await this.supabase
          .from('payment_transactions')
          .update({
            status: 'failed' as PaymentStatus,
            failure_reason: error.message,
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        throw new PaymentServiceError(
          'Payment capture failed',
          'PAYMENT_CAPTURE_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Cancel/refund payment
   */
  async refundPayment(
    paymentIntentId: string,
    refundAmount?: number,
    reason?: string
  ): Promise<void> {
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    try {
      // Get payment intent to find the charge
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (!paymentIntent.charges?.data[0]) {
        throw new PaymentServiceError(
          'No charge found for payment intent',
          'NO_CHARGE_FOUND',
          400
        );
      }

      // Create refund
      const refund = await stripe.refunds.create({
        charge: paymentIntent.charges.data[0].id,
        amount: refundAmount,
        reason: reason || 'requested_by_customer',
        metadata: {
          payment_intent_id: paymentIntentId,
        },
      });

      // Update payment transaction record
      const { error: updateError } = await this.supabase
        .from('payment_transactions')
        .update({
          status: 'refunded' as PaymentStatus,
          refunded_at: new Date().toISOString(),
          refund_amount: (refundAmount || paymentIntent.amount) / 100,
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error('Failed to update payment transaction:', updateError);
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Payment refund failed',
          'PAYMENT_REFUND_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethodData[]> {
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    const customerId = await this.ensureCustomer(userId);

    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      // Get default payment method
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const defaultPaymentMethodId = customer.invoice_settings.default_payment_method as string;

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : undefined,
        isDefault: pm.id === defaultPaymentMethodId,
      }));
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to retrieve payment methods',
          'PAYMENT_METHODS_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    const customerId = await this.ensureCustomer(userId);

    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to set default payment method',
          'DEFAULT_PAYMENT_METHOD_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    if (!stripe) {
      throw new PaymentServiceError(
        'Stripe not configured',
        'STRIPE_NOT_CONFIGURED',
        500
      );
    }

    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to delete payment method',
          'DELETE_PAYMENT_METHOD_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Calculate pricing for mail campaigns
   */
  calculateCampaignPricing(params: {
    mailPieceCount: number;
    designServiceType?: 'basic' | 'custom' | 'premium';
    addressValidationCount?: number;
    dataEnrichmentServices?: Array<'skipTracing' | 'propertyData' | 'contactData'>;
    userPlan: SubscriptionPlan;
  }) {
    const {
      mailPieceCount,
      designServiceType,
      addressValidationCount = 0,
      dataEnrichmentServices = [],
      userPlan,
    } = params;

    let totalCost = 0;
    const breakdown: Record<string, number> = {};

    // Mail piece pricing with volume discounts
    let mailPiecePrice = USAGE_PRICING.mailPieces.basePrice;
    const applicableDiscount = USAGE_PRICING.mailPieces.volumeDiscounts
      .reverse()
      .find(discount => mailPieceCount >= discount.minQuantity);
    
    if (applicableDiscount) {
      mailPiecePrice *= (1 - applicableDiscount.discount);
    }

    const mailPieceCost = mailPieceCount * mailPiecePrice;
    totalCost += mailPieceCost;
    breakdown.mailPieces = mailPieceCost;

    // Design services
    if (designServiceType) {
      const designCost = USAGE_PRICING.designServices[`${designServiceType}Design`];
      totalCost += designCost;
      breakdown.design = designCost;
    }

    // Address validation (after free tier)
    const freeValidations = USAGE_PRICING.addressValidation.freeValidationsPerMonth[userPlan];
    const billableValidations = Math.max(0, addressValidationCount - freeValidations);
    if (billableValidations > 0) {
      const validationCost = billableValidations * USAGE_PRICING.addressValidation.pricePerValidation;
      totalCost += validationCost;
      breakdown.addressValidation = validationCost;
    }

    // Data enrichment services
    let enrichmentCost = 0;
    dataEnrichmentServices.forEach(service => {
      const serviceCost = USAGE_PRICING.dataEnrichment[service] * mailPieceCount;
      enrichmentCost += serviceCost;
    });
    if (enrichmentCost > 0) {
      totalCost += enrichmentCost;
      breakdown.dataEnrichment = enrichmentCost;
    }

    return {
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      breakdown,
      discountApplied: applicableDiscount?.discount || 0,
    };
  }
}