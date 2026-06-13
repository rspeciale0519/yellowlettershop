/**
 * PaymentMethodManager Component
 * 
 * Manages customer payment methods.
 * Lists existing payment methods and allows adding new ones.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CreditCard, AlertCircle } from 'lucide-react';
import { PaymentMethodCard } from './PaymentMethodCard';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';
import type { PaymentMethodData } from '@/lib/payments/payment-service';

interface PaymentMethodManagerProps {
  userId?: string;
  onPaymentMethodsChange?: (methods: PaymentMethodData[]) => void;
  showAddButton?: boolean;
  maxMethods?: number;
}

export function PaymentMethodManager({
  userId,
  onPaymentMethodsChange,
  showAddButton = true,
  maxMethods = 5,
}: PaymentMethodManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
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
      onPaymentMethodsChange?.(data.paymentMethods || []);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment methods';
      setError(errorMessage);
      console.error('Error fetching payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set default payment method
  const handleSetDefault = async (paymentMethodId: string) => {
    setIsUpdating(true);
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

      // Refresh payment methods list
      await fetchPaymentMethods();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment method';
      setError(errorMessage);
      console.error('Error setting default payment method:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete payment method
  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    setIsUpdating(true);
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

      // Refresh payment methods list
      await fetchPaymentMethods();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment method';
      setError(errorMessage);
      console.error('Error deleting payment method:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle successful payment method addition
  const handlePaymentMethodAdded = () => {
    setShowAddModal(false);
    fetchPaymentMethods(); // Refresh the list
  };

  // Initial load
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Methods</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Payment Methods</span>
            </CardTitle>
            
            {showAddButton && paymentMethods.length < maxMethods && (
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                disabled={isUpdating}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Card
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payment methods
              </h3>
              <p className="text-gray-500 mb-4">
                Add a payment method to start making purchases and manage subscriptions.
              </p>
              {showAddButton && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Card
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  paymentMethod={method}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                  isLoading={isUpdating}
                />
              ))}
              
              {paymentMethods.length >= maxMethods && (
                <div className="text-sm text-gray-500 text-center py-2">
                  You have reached the maximum number of payment methods ({maxMethods}).
                  Remove a card to add a new one.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentMethodModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handlePaymentMethodAdded}
      />
    </>
  );
}