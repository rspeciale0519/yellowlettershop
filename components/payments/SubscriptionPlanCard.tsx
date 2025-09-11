/**
 * SubscriptionPlanCard Component
 * 
 * Displays subscription plan details with pricing and features.
 * Supports current plan indication, upgrade/downgrade actions.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/stripe-config';
import type { SubscriptionPlan } from '@/types/supabase-comprehensive';

interface SubscriptionPlanCardProps {
  planKey: keyof typeof SUBSCRIPTION_PLANS;
  currentPlan?: SubscriptionPlan;
  billingInterval: 'monthly' | 'yearly';
  onSelectPlan?: (planKey: keyof typeof SUBSCRIPTION_PLANS) => void;
  isLoading?: boolean;
  showFeatures?: boolean;
  highlighted?: boolean;
}

export function SubscriptionPlanCard({
  planKey,
  currentPlan,
  billingInterval,
  onSelectPlan,
  isLoading = false,
  showFeatures = true,
  highlighted = false,
}: SubscriptionPlanCardProps) {
  const plan = SUBSCRIPTION_PLANS[planKey];
  const isCurrentPlan = currentPlan === planKey;
  const isFreePlan = planKey === 'free';
  
  // Calculate savings for yearly billing
  const monthlyCost = plan.price.monthly;
  const yearlyCost = plan.price.yearly;
  const yearlyMonthlyEquivalent = yearlyCost / 12;
  const savingsPercent = monthlyCost > 0 ? Math.round(((monthlyCost - yearlyMonthlyEquivalent) / monthlyCost) * 100) : 0;

  const handleSelectPlan = () => {
    if (onSelectPlan && !isCurrentPlan) {
      onSelectPlan(planKey);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const getPlanIcon = () => {
    switch (planKey) {
      case 'pro':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'team':
        return <Star className="w-5 h-5 text-purple-500" />;
      case 'enterprise':
        return <Star className="w-5 h-5 text-amber-500 fill-current" />;
      default:
        return null;
    }
  };

  const getActionButtonText = () => {
    if (isCurrentPlan) {
      return 'Current Plan';
    }
    
    if (isFreePlan) {
      return 'Downgrade to Free';
    }
    
    if (currentPlan === 'free') {
      return 'Upgrade';
    }
    
    // Determine if it's an upgrade or downgrade
    const planOrder = { free: 0, pro: 1, team: 2, enterprise: 3 };
    const currentOrder = planOrder[currentPlan || 'free'];
    const targetOrder = planOrder[planKey];
    
    return targetOrder > currentOrder ? 'Upgrade' : 'Downgrade';
  };

  const getActionButtonVariant = () => {
    if (isCurrentPlan) {
      return 'secondary';
    }
    
    if (highlighted || planKey === 'pro') {
      return 'default';
    }
    
    return 'outline';
  };

  return (
    <Card 
      className={`relative w-full h-full ${
        highlighted ? 'ring-2 ring-primary shadow-lg' : ''
      } ${isCurrentPlan ? 'border-primary' : ''}`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2">
          {getPlanIcon()}
          <CardTitle className="text-xl capitalize">{planKey}</CardTitle>
          {isCurrentPlan && (
            <Badge variant="secondary" className="ml-2">
              Current
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold">
            {formatPrice(plan.price[billingInterval])}
            {!isFreePlan && (
              <span className="text-lg font-normal text-gray-500">
                /{billingInterval === 'yearly' ? 'year' : 'month'}
              </span>
            )}
          </div>
          
          {billingInterval === 'yearly' && !isFreePlan && savingsPercent > 0 && (
            <div className="text-sm text-green-600 font-medium">
              Save {savingsPercent}% with yearly billing
            </div>
          )}
          
          {billingInterval === 'yearly' && !isFreePlan && (
            <div className="text-xs text-gray-500">
              ${yearlyMonthlyEquivalent.toFixed(0)}/month billed annually
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {showFeatures && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-900">Features:</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="pt-2 space-y-1 text-xs text-gray-500 border-t">
              <div>Max Users: {plan.maxUsers}</div>
              <div>
                Max Campaigns: {plan.maxCampaigns === -1 ? 'Unlimited' : plan.maxCampaigns}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleSelectPlan}
          disabled={isCurrentPlan || isLoading}
          variant={getActionButtonVariant()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            getActionButtonText()
          )}
        </Button>

        {!isFreePlan && (
          <div className="text-xs text-center text-gray-500">
            Cancel anytime. Changes take effect at your next billing cycle.
          </div>
        )}
      </CardContent>
    </Card>
  );
}