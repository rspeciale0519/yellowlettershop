/**
 * PaymentMethodCard Component
 * 
 * Displays a payment method card with actions.
 * Shows card details, default status, and management options.
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Trash2, Star } from 'lucide-react';
import type { PaymentMethodData } from '@/lib/payments/payment-service';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethodData;
  onSetDefault?: (paymentMethodId: string) => void;
  onDelete?: (paymentMethodId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export function PaymentMethodCard({
  paymentMethod,
  onSetDefault,
  onDelete,
  isLoading = false,
  showActions = true,
}: PaymentMethodCardProps) {
  const handleSetDefault = () => {
    if (onSetDefault && !paymentMethod.isDefault) {
      onSetDefault(paymentMethod.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && !paymentMethod.isDefault) {
      onDelete(paymentMethod.id);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    // In a real app, you might want to use actual brand icons
    return <CreditCard className="h-5 w-5" />;
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <Card className={`w-full ${paymentMethod.isDefault ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {paymentMethod.card && getCardBrandIcon(paymentMethod.card.brand)}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {paymentMethod.card && formatCardBrand(paymentMethod.card.brand)} 
                  {paymentMethod.card && `•••• ${paymentMethod.card.last4}`}
                </span>
                {paymentMethod.isDefault && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span>Default</span>
                  </Badge>
                )}
              </div>
              
              {paymentMethod.card && (
                <div className="text-sm text-gray-500 mt-1">
                  Expires {paymentMethod.card.expMonth.toString().padStart(2, '0')}/
                  {paymentMethod.card.expYear.toString().slice(-2)}
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center space-x-2">
              {!paymentMethod.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetDefault}
                  disabled={isLoading}
                >
                  Set Default
                </Button>
              )}
              
              {!paymentMethod.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {paymentMethod.isDefault && showActions && (
          <div className="mt-3 text-xs text-gray-500">
            This is your default payment method for subscriptions and orders.
          </div>
        )}
      </CardContent>
    </Card>
  );
}