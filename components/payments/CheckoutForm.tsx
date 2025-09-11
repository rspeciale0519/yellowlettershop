/**
 * CheckoutForm Component
 * 
 * Stripe Elements checkout form for processing payments.
 * Handles payment intent confirmation and error states.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield } from 'lucide-react';

interface CheckoutFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  description: string;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: string) => void;
  returnUrl?: string;
  showPaymentSummary?: boolean;
}

export function CheckoutForm({
  clientSecret,
  amount,
  currency,
  description,
  onSuccess,
  onError,
  returnUrl,
  showPaymentSummary = true,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Clear error when elements change
  useEffect(() => {
    if (elements) {
      setError(null);
    }
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message || 'An error occurred while processing your payment.');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment confirmation failed.');
        onError?.(confirmError.message || 'Payment confirmation failed.');
      } else if (paymentIntent) {
        setIsComplete(true);
        onSuccess?.(paymentIntent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Authorized
          </h3>
          <p className="text-gray-600 mb-4">
            Your payment has been authorized successfully. We'll capture the payment once your order is ready for fulfillment.
          </p>
          <div className="text-sm text-gray-500">
            Amount: {formatAmount(amount, currency)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {showPaymentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium">{description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-lg">
                  {formatAmount(amount, currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
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

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>
                Your payment information is encrypted and secure.
                We use Stripe for payment processing.
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!stripe || !elements || isProcessing}
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Authorize Payment - {formatAmount(amount, currency)}</span>
                </div>
              )}
            </Button>

            <div className="text-xs text-center text-gray-500">
              By confirming your payment, you agree to our terms of service.
              Your payment will be authorized but not charged until your order is fulfilled.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}