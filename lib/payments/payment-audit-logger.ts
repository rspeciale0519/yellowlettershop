/**
 * Payment Audit Logger
 * 
 * Provides comprehensive audit logging for payment operations.
 * Tracks payment transactions, subscription changes, and security events.
 */

import { createServiceClient } from '@/utils/supabase/service';
import type { PaymentStatus, SubscriptionPlan } from '@/types/supabase-comprehensive';

export type PaymentAuditEventType = 
  | 'payment_intent_created'
  | 'payment_authorized'
  | 'payment_captured'
  | 'payment_failed'
  | 'payment_refunded'
  | 'payment_disputed'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_reactivated'
  | 'payment_method_added'
  | 'payment_method_updated'
  | 'payment_method_deleted'
  | 'pricing_calculated'
  | 'webhook_received'
  | 'security_event';

export interface PaymentAuditLogEntry {
  user_id?: string;
  team_id?: string;
  event_type: PaymentAuditEventType;
  payment_intent_id?: string;
  subscription_id?: string;
  customer_id?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus | string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export class PaymentAuditLogger {
  private supabase = createServiceClient();

  /**
   * Log payment audit event
   */
  async log(entry: PaymentAuditLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_analytics')
        .insert({
          user_id: entry.user_id || null,
          event_type: entry.event_type,
          metadata: {
            ...entry.metadata,
            team_id: entry.team_id,
            payment_intent_id: entry.payment_intent_id,
            subscription_id: entry.subscription_id,
            customer_id: entry.customer_id,
            amount: entry.amount,
            currency: entry.currency,
            status: entry.status,
            ip_address: entry.ip_address,
            user_agent: entry.user_agent,
            session_id: entry.session_id,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) {
        console.error('Payment audit log error:', error);
      }
    } catch (error) {
      console.error('Payment audit logging failed:', error);
    }
  }

  /**
   * Log payment intent creation
   */
  async logPaymentIntentCreated(params: {
    userId: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    description: string;
    campaignId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'payment_intent_created',
      payment_intent_id: params.paymentIntentId,
      amount: params.amount,
      currency: params.currency,
      metadata: {
        description: params.description,
        campaign_id: params.campaignId,
        ...params.metadata,
      },
    });
  }

  /**
   * Log payment authorization
   */
  async logPaymentAuthorized(params: {
    userId?: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    paymentMethodId?: string;
    customerId: string;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'payment_authorized',
      payment_intent_id: params.paymentIntentId,
      customer_id: params.customerId,
      amount: params.amount,
      currency: params.currency,
      status: 'authorized',
      metadata: {
        payment_method_id: params.paymentMethodId,
      },
    });
  }

  /**
   * Log payment capture
   */
  async logPaymentCaptured(params: {
    userId?: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    captureAmount?: number;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'payment_captured',
      payment_intent_id: params.paymentIntentId,
      amount: params.captureAmount || params.amount,
      currency: params.currency,
      status: 'captured',
      metadata: {
        original_amount: params.amount,
        captured_amount: params.captureAmount || params.amount,
      },
    });
  }

  /**
   * Log payment failure
   */
  async logPaymentFailed(params: {
    userId?: string;
    paymentIntentId: string;
    amount?: number;
    currency?: string;
    failureReason: string;
    failureCode?: string;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'payment_failed',
      payment_intent_id: params.paymentIntentId,
      amount: params.amount,
      currency: params.currency,
      status: 'failed',
      metadata: {
        failure_reason: params.failureReason,
        failure_code: params.failureCode,
      },
    });
  }

  /**
   * Log payment refund
   */
  async logPaymentRefunded(params: {
    userId?: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    refundAmount: number;
    reason?: string;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'payment_refunded',
      payment_intent_id: params.paymentIntentId,
      amount: params.refundAmount,
      currency: params.currency,
      status: 'refunded',
      metadata: {
        original_amount: params.amount,
        refund_amount: params.refundAmount,
        refund_reason: params.reason,
      },
    });
  }

  /**
   * Log subscription creation
   */
  async logSubscriptionCreated(params: {
    userId?: string;
    teamId?: string;
    subscriptionId: string;
    customerId: string;
    plan: SubscriptionPlan;
    billingInterval: 'monthly' | 'yearly';
    amount: number;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      team_id: params.teamId,
      event_type: 'subscription_created',
      subscription_id: params.subscriptionId,
      customer_id: params.customerId,
      amount: params.amount,
      currency: 'usd',
      status: 'active',
      metadata: {
        plan: params.plan,
        billing_interval: params.billingInterval,
      },
    });
  }

  /**
   * Log subscription update
   */
  async logSubscriptionUpdated(params: {
    userId?: string;
    teamId?: string;
    subscriptionId: string;
    oldPlan: SubscriptionPlan;
    newPlan: SubscriptionPlan;
    oldBillingInterval?: 'monthly' | 'yearly';
    newBillingInterval?: 'monthly' | 'yearly';
    prorationAmount?: number;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      team_id: params.teamId,
      event_type: 'subscription_updated',
      subscription_id: params.subscriptionId,
      amount: params.prorationAmount,
      currency: 'usd',
      metadata: {
        old_plan: params.oldPlan,
        new_plan: params.newPlan,
        old_billing_interval: params.oldBillingInterval,
        new_billing_interval: params.newBillingInterval,
        proration_amount: params.prorationAmount,
      },
    });
  }

  /**
   * Log subscription cancellation
   */
  async logSubscriptionCancelled(params: {
    userId?: string;
    teamId?: string;
    subscriptionId: string;
    plan: SubscriptionPlan;
    cancelAtPeriodEnd: boolean;
    reason?: string;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      team_id: params.teamId,
      event_type: 'subscription_cancelled',
      subscription_id: params.subscriptionId,
      status: 'cancelled',
      metadata: {
        plan: params.plan,
        cancel_at_period_end: params.cancelAtPeriodEnd,
        cancellation_reason: params.reason,
      },
    });
  }

  /**
   * Log payment method operations
   */
  async logPaymentMethodAdded(params: {
    userId: string;
    paymentMethodId: string;
    customerId: string;
    isDefault: boolean;
    type: string;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'payment_method_added',
      customer_id: params.customerId,
      metadata: {
        payment_method_id: params.paymentMethodId,
        payment_method_type: params.type,
        is_default: params.isDefault,
      },
    });
  }

  /**
   * Log pricing calculation
   */
  async logPricingCalculated(params: {
    userId: string;
    mailPieceCount: number;
    totalCost: number;
    breakdown: Record<string, number>;
    userPlan: SubscriptionPlan;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'pricing_calculated',
      amount: params.totalCost * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        mail_piece_count: params.mailPieceCount,
        total_cost: params.totalCost,
        cost_breakdown: params.breakdown,
        user_plan: params.userPlan,
      },
    });
  }

  /**
   * Log webhook events
   */
  async logWebhookReceived(params: {
    eventType: string;
    eventId: string;
    stripeObjectId: string;
    processed: boolean;
    error?: string;
  }): Promise<void> {
    await this.log({
      event_type: 'webhook_received',
      metadata: {
        stripe_event_type: params.eventType,
        stripe_event_id: params.eventId,
        stripe_object_id: params.stripeObjectId,
        processed_successfully: params.processed,
        processing_error: params.error,
      },
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(params: {
    userId?: string;
    eventType: string;
    description: string;
    ipAddress?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      user_id: params.userId,
      event_type: 'security_event',
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      metadata: {
        security_event_type: params.eventType,
        description: params.description,
        severity: params.severity,
        ...params.metadata,
      },
    });
  }

  /**
   * Query audit logs
   */
  async getAuditLogs(params: {
    userId?: string;
    teamId?: string;
    eventTypes?: PaymentAuditEventType[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    let query = this.supabase
      .from('user_analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.eventTypes && params.eventTypes.length > 0) {
      query = query.in('event_type', params.eventTypes);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate.toISOString());
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve audit logs: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance
export const paymentAuditLogger = new PaymentAuditLogger();