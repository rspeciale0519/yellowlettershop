/**
 * useSubscription Hook
 * 
 * Manages subscription state and operations.
 * Provides functions for creating, updating, and managing subscriptions.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/stripe-config';
import type { SubscriptionPlan } from '@/types/supabase-comprehensive';

export interface SubscriptionData {
  id: string;
  plan: SubscriptionPlan;
  billingInterval: 'monthly' | 'yearly';
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  amount: number;
  features: string[];
  nextInvoiceDate?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface CreateSubscriptionParams {
  planKey: keyof typeof SUBSCRIPTION_PLANS;
  billingInterval: 'monthly' | 'yearly';
  paymentMethodId?: string;
  teamId?: string;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  newPlanKey: keyof typeof SUBSCRIPTION_PLANS;
  newBillingInterval?: 'monthly' | 'yearly';
}

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createSubscription = useCallback(async (params: CreateSubscriptionParams): Promise<SubscriptionData | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const data = await response.json();
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
        nextInvoiceDate: data.subscription.nextInvoiceDate 
          ? new Date(data.subscription.nextInvoiceDate) 
          : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateSubscription = useCallback(async (params: UpdateSubscriptionParams): Promise<SubscriptionData | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      const data = await response.json();
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
        nextInvoiceDate: data.subscription.nextInvoiceDate 
          ? new Date(data.subscription.nextInvoiceDate) 
          : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const cancelSubscription = useCallback(async (params: {
    subscriptionId: string;
    cancelAtPeriodEnd?: boolean;
    reason?: string;
  }): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const reactivateSubscription = useCallback(async (subscriptionId: string): Promise<SubscriptionData | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate subscription');
      }

      const data = await response.json();
      return {
        ...data.subscription,
        currentPeriodStart: new Date(data.subscription.currentPeriodStart),
        currentPeriodEnd: new Date(data.subscription.currentPeriodEnd),
        nextInvoiceDate: data.subscription.nextInvoiceDate 
          ? new Date(data.subscription.nextInvoiceDate) 
          : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate subscription';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getPricingInfo = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/calculate-pricing', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get pricing info');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get pricing info';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getUpgradePreview = useCallback(async (params: {
    subscriptionId: string;
    newPlanKey: keyof typeof SUBSCRIPTION_PLANS;
    newBillingInterval?: 'monthly' | 'yearly';
  }) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    // This would call a preview endpoint to show cost changes
    // For now, we can calculate this client-side using the pricing data
    const pricingInfo = await getPricingInfo();
    if (!pricingInfo) return null;

    const currentPlan = SUBSCRIPTION_PLANS[pricingInfo.userPlan as keyof typeof SUBSCRIPTION_PLANS];
    const newPlan = SUBSCRIPTION_PLANS[params.newPlanKey];
    const interval = params.newBillingInterval || 'monthly';

    return {
      currentPlan: pricingInfo.userPlan,
      newPlan: params.newPlanKey,
      currentAmount: currentPlan.price[interval],
      newAmount: newPlan.price[interval],
      difference: newPlan.price[interval] - currentPlan.price[interval],
      isUpgrade: newPlan.price[interval] > currentPlan.price[interval],
    };
  }, [user, getPricingInfo]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    getPricingInfo,
    getUpgradePreview,
    clearError,
  };
}