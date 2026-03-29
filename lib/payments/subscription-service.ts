/**
 * Subscription Management Service
 * 
 * Handles subscription lifecycle management including:
 * - Creating and updating subscriptions
 * - Plan upgrades and downgrades
 * - Subscription billing and prorations
 * - Team subscription management
 */

import Stripe from 'stripe';
import { stripe, requireStripe, SUBSCRIPTION_PLANS } from './stripe-config';
import { PaymentServiceError, mapStripeStatusToDb } from './types';
import { createServiceClient } from '@/utils/supabase/service';
import type { 
  SubscriptionPlan,
  SubscriptionStatus,
  UserProfile,
  Team
} from '@/types/supabase-comprehensive';

export interface CreateSubscriptionParams {
  userId: string;
  planKey: keyof typeof SUBSCRIPTION_PLANS;
  billingInterval: 'monthly' | 'yearly';
  paymentMethodId?: string;
  teamId?: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface SubscriptionDetails {
  id: string;
  customerId: string;
  status: string;
  plan: SubscriptionPlan;
  billingInterval: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  nextInvoiceDate?: Date;
  pastDue: boolean;
}

/**
 * Subscription Service Class
 */
export class SubscriptionService {
  private supabase = createServiceClient();

  /**
   * Create new subscription for user or team
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionDetails> {
    requireStripe();

    const {
      userId,
      planKey,
      billingInterval,
      paymentMethodId,
      teamId,
      prorationBehavior = 'create_prorations',
    } = params;

    // Validate plan exists and is not free
    const planConfig = SUBSCRIPTION_PLANS[planKey];
    if (!planConfig || planKey === 'free') {
      throw new PaymentServiceError(
        'Invalid subscription plan',
        'INVALID_PLAN',
        400
      );
    }

    // Get the correct price ID based on billing interval
    const priceId = billingInterval === 'yearly' 
      ? planConfig.yearlyPriceId 
      : planConfig.monthlyPriceId;

    if (!priceId) {
      throw new PaymentServiceError(
        'Price ID not configured for plan',
        'PRICE_ID_MISSING',
        500
      );
    }

    // Get or create customer
    const customerId = await this.ensureCustomer(userId);

    try {
      // Set default payment method if provided
      if (paymentMethodId) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        proration_behavior: prorationBehavior,
        metadata: {
          userId,
          teamId: teamId || '',
          plan: planKey,
          billingInterval,
        },
      });

      // Update user/team profile with subscription details
      if (teamId) {
        await this.updateTeamSubscription(teamId, {
          stripe_subscription_id: subscription.id,
          stripeCustomerId: customerId,
          plan: planKey as SubscriptionPlan,
          status: mapStripeStatusToDb(subscription.status),
        });
      } else {
        await this.updateUserSubscription(userId, {
          stripe_subscription_id: subscription.id,
          stripeCustomerId: customerId,
          subscription_plan: planKey as SubscriptionPlan,
          subscription_status: mapStripeStatusToDb(subscription.status),
        });
      }

      return this.mapStripeSubscription(subscription, planKey as SubscriptionPlan, billingInterval);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Subscription creation failed',
          'SUBSCRIPTION_CREATE_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Update existing subscription (upgrade/downgrade)
   */
  async updateSubscription(params: {
    subscriptionId: string;
    newPlanKey: keyof typeof SUBSCRIPTION_PLANS;
    newBillingInterval?: 'monthly' | 'yearly';
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  }): Promise<SubscriptionDetails> {
    requireStripe();

    const {
      subscriptionId,
      newPlanKey,
      newBillingInterval = 'monthly',
      prorationBehavior = 'create_prorations',
    } = params;

    // Validate plan
    const planConfig = SUBSCRIPTION_PLANS[newPlanKey];
    if (!planConfig || newPlanKey === 'free') {
      throw new PaymentServiceError(
        'Invalid subscription plan',
        'INVALID_PLAN',
        400
      );
    }

    const newPriceId = newBillingInterval === 'yearly'
      ? planConfig.yearlyPriceId
      : planConfig.monthlyPriceId;

    if (!newPriceId) {
      throw new PaymentServiceError(
        'Price ID not configured for plan',
        'PRICE_ID_MISSING',
        500
      );
    }

    try {
      // Get current subscription
      const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (!currentSubscription.items.data[0]) {
        throw new PaymentServiceError(
          'No subscription item found',
          'NO_SUBSCRIPTION_ITEM',
          400
        );
      }

      // Update subscription
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
        metadata: {
          ...currentSubscription.metadata,
          plan: newPlanKey,
          billingInterval: newBillingInterval,
        },
      });

      // Update database records
      const userId = currentSubscription.metadata.userId;
      const teamId = currentSubscription.metadata.teamId;

      if (teamId) {
        await this.updateTeamSubscription(teamId, {
          plan: newPlanKey as SubscriptionPlan,
          status: mapStripeStatusToDb(updatedSubscription.status),
        });
      } else if (userId) {
        await this.updateUserSubscription(userId, {
          subscription_plan: newPlanKey as SubscriptionPlan,
          subscription_status: mapStripeStatusToDb(updatedSubscription.status),
        });
      }

      return this.mapStripeSubscription(
        updatedSubscription, 
        newPlanKey as SubscriptionPlan, 
        newBillingInterval
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Subscription update failed',
          'SUBSCRIPTION_UPDATE_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<void> {
    requireStripe();

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      // Update database status
      const userId = subscription.metadata.userId;
      const teamId = subscription.metadata.teamId;

      const newStatus = cancelAtPeriodEnd ? 'active' : 'cancelled';

      if (teamId) {
        await this.updateTeamSubscription(teamId, {
          status: newStatus as SubscriptionStatus,
        });
      } else if (userId) {
        await this.updateUserSubscription(userId, {
          subscription_status: newStatus as SubscriptionStatus,
        });
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Subscription cancellation failed',
          'SUBSCRIPTION_CANCEL_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
    requireStripe();

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database status
      const userId = subscription.metadata.userId;
      const teamId = subscription.metadata.teamId;
      const planKey = subscription.metadata.plan as keyof typeof SUBSCRIPTION_PLANS;

      if (teamId) {
        await this.updateTeamSubscription(teamId, {
          status: mapStripeStatusToDb(subscription.status),
        });
      } else if (userId) {
        await this.updateUserSubscription(userId, {
          subscription_status: mapStripeStatusToDb(subscription.status),
        });
      }

      return this.mapStripeSubscription(
        subscription,
        planKey as SubscriptionPlan,
        subscription.metadata.billingInterval as 'monthly' | 'yearly'
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Subscription reactivation failed',
          'SUBSCRIPTION_REACTIVATE_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
    requireStripe();

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const planKey = subscription.metadata.plan as keyof typeof SUBSCRIPTION_PLANS;
      const billingInterval = subscription.metadata.billingInterval as 'monthly' | 'yearly';

      return this.mapStripeSubscription(subscription, planKey as SubscriptionPlan, billingInterval);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to retrieve subscription',
          'SUBSCRIPTION_RETRIEVAL_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get upcoming invoice preview for plan changes
   */
  async previewInvoice(params: {
    customerId: string;
    subscriptionId?: string;
    newPriceId?: string;
    prorationDate?: number;
  }) {
    requireStripe();

    try {
      const invoice = await stripe.invoices.upcoming({
        customer: params.customerId,
        subscription: params.subscriptionId,
        subscription_items: params.newPriceId ? [{
          id: params.subscriptionId,
          price: params.newPriceId,
        }] : undefined,
        subscription_proration_date: params.prorationDate,
      });

      return {
        amountDue: invoice.amount_due / 100,
        amountRemaining: invoice.amount_remaining / 100,
        subtotal: invoice.subtotal / 100,
        total: invoice.total / 100,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentServiceError(
          'Failed to preview invoice',
          'INVOICE_PREVIEW_ERROR',
          400,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async ensureCustomer(userId: string): Promise<string> {
    // Get user profile to check existing customer ID
    const { data: profile, error: profileError } = await this.supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile.stripe_customer_id) {
      throw new PaymentServiceError(
        'Customer not found - create customer first',
        'CUSTOMER_NOT_FOUND',
        400
      );
    }

    return profile.stripe_customer_id;
  }

  private async updateUserSubscription(
    userId: string, 
    updates: Partial<Pick<UserProfile, 'stripe_subscription_id' | 'stripe_customer_id' | 'subscription_plan' | 'subscription_status'>>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update user subscription:', error);
    }
  }

  private async updateTeamSubscription(
    teamId: string,
    updates: Partial<Pick<Team, 'stripe_subscription_id' | 'stripe_customer_id' | 'plan'>> & { status?: SubscriptionStatus }
  ): Promise<void> {
    const { error } = await this.supabase
      .from('teams')
      .update(updates)
      .eq('id', teamId);

    if (error) {
      console.error('Failed to update team subscription:', error);
    }
  }

  private mapStripeSubscription(
    subscription: Stripe.Subscription,
    plan: SubscriptionPlan,
    billingInterval: 'monthly' | 'yearly'
  ): SubscriptionDetails {
    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      status: subscription.status,
      plan,
      billingInterval,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0]?.price.id || '',
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      nextInvoiceDate: subscription.next_pending_invoice_item_invoice
        ? new Date(subscription.next_pending_invoice_item_invoice * 1000)
        : undefined,
      pastDue: subscription.status === 'past_due',
    };
  }
}