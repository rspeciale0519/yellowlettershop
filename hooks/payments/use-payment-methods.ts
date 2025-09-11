/**
 * usePaymentMethods Hook
 * 
 * Manages customer payment methods.
 * Provides functions for fetching, adding, updating, and deleting payment methods.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PaymentMethodData } from '@/lib/payments/payment-service';

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPaymentMethods = useCallback(async () => {
    if (!user) {
      setPaymentMethods([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/payment-methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment methods';
      setError(errorMessage);
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setError(null);

    try {
      const response = await fetch('/api/payments/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default payment method');
      }

      // Update local state
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === paymentMethodId,
      })));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment method';
      setError(errorMessage);
      return false;
    }
  }, [user]);

  const deletePaymentMethod = useCallback(async (paymentMethodId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setError(null);

    try {
      const response = await fetch(`/api/payments/payment-methods?paymentMethodId=${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete payment method');
      }

      // Update local state
      setPaymentMethods(prev => prev.filter(method => method.id !== paymentMethodId));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment method';
      setError(errorMessage);
      return false;
    }
  }, [user]);

  const addPaymentMethod = useCallback(async (paymentMethodId: string, setAsDefault = false): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    setError(null);

    try {
      const response = await fetch('/api/payments/attach-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentMethodId,
          setAsDefault,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add payment method');
      }

      // Refresh payment methods
      await fetchPaymentMethods();

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
      setError(errorMessage);
      return false;
    }
  }, [user, fetchPaymentMethods]);

  const getDefaultPaymentMethod = useCallback((): PaymentMethodData | null => {
    return paymentMethods.find(method => method.isDefault) || null;
  }, [paymentMethods]);

  const hasPaymentMethods = useCallback((): boolean => {
    return paymentMethods.length > 0;
  }, [paymentMethods]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch payment methods when user changes
  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    } else {
      setPaymentMethods([]);
      setError(null);
    }
  }, [user, fetchPaymentMethods]);

  return {
    paymentMethods,
    isLoading,
    error,
    fetchPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    addPaymentMethod,
    getDefaultPaymentMethod,
    hasPaymentMethods,
    clearError,
  };
}