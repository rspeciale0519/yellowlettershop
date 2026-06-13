/**
 * AddPaymentMethodModal Component
 * 
 * Modal for adding new payment methods using Stripe Elements.
 * Handles payment method setup without creating a payment.
 */

'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, X } from 'lucide-react';

interface AddPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddPaymentMethodModal({
  open,
  onOpenChange,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Submit form elements
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'An error occurred while validating your payment method.');
        setIsProcessing(false);
        return;
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          type: 'card',
        },
      });

      if (paymentMethodError) {
        setError(paymentMethodError.message || 'Failed to create payment method.');
        setIsProcessing(false);
        return;
      }

      if (paymentMethod) {
        // Attach payment method to customer via API
        const response = await fetch('/api/payments/attach-payment-method', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save payment method');
        }

        // Success
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Add Payment Method</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Add a new payment method to your account. This card will be available for future purchases and subscriptions.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <PaymentElement 
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card'],
                  fields: {
                    billingDetails: 'auto',
                  },
                }}
                onChange={(event) => {
                  if (event.error) {
                    setError(event.error.message);
                  } else {
                    setError(null);
                  }
                }}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={!stripe || !elements || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Add Card</span>
                  </div>
                )}
              </Button>
            </div>
          </form>

          <div className="text-xs text-center text-gray-500">
            Your payment information is encrypted and secure. We use Stripe for payment processing.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}