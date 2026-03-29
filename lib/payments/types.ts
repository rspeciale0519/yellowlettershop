/**
 * Payment Service Types
 */

import type { PaymentStatus } from '@/types/supabase';
import type { SubscriptionStatus } from '@/types/supabase-comprehensive';

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
}

export interface CreatePaymentIntentParams {
  userId: string;
  amount: number; // Amount in cents
  currency?: string;
  description: string;
  campaignId?: string;
  metadata?: Record<string, string>;
  automaticPaymentMethods?: boolean;
}

export interface CapturePaymentParams {
  paymentIntentId: string;
  amount?: number;
  metadata?: Record<string, string>;
}

export interface RefundPaymentParams {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionParams {
  userId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
}

/**
 * Map Stripe subscription status strings to our internal SubscriptionStatus type.
 * Shared between SubscriptionService and the Stripe webhook route.
 */
export function mapStripeStatusToDb(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    default:
      return 'active';
  }
}