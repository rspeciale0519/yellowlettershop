/**
 * usePayment Hook
 * 
 * Manages payment state and operations.
 * Provides functions for creating payment intents, capturing payments, and refunds.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export interface PaymentIntentData {
  id: string;
  clientSecret: string;
  amount: number;
  status: string;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  description: string;
  campaignId?: string;
  metadata?: Record<string, string>;
}

export interface CapturePaymentParams {
  paymentIntentId: string;
  captureAmount?: number;
}

export interface RefundPaymentParams {
  paymentIntentId: string;
  refundAmount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export function usePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createPaymentIntent = useCallback(async (params: CreatePaymentIntentParams): Promise<PaymentIntentData | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const capturePayment = useCallback(async (params: CapturePaymentParams): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to capture payment');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture payment';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const refundPayment = useCallback(async (params: RefundPaymentParams): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/refund-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refund payment');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refund payment';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const calculatePricing = useCallback(async (params: {
    mailPieceCount: number;
    designServiceType?: 'basic' | 'custom' | 'premium';
    addressValidationCount?: number;
    dataEnrichmentServices?: Array<'skipTracing' | 'propertyData' | 'contactData'>;
  }) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/calculate-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate pricing');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate pricing';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    createPaymentIntent,
    capturePayment,
    refundPayment,
    calculatePricing,
    clearError,
  };
}