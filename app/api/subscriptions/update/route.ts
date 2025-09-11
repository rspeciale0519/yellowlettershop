/**
 * Update Subscription API Route
 * 
 * Updates existing subscription (upgrade/downgrade).
 * Handles plan changes, billing interval changes, and prorations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionService } from '@/lib/payments/subscription-service';
import { PaymentServiceError } from '@/lib/payments/payment-service';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/stripe-config';
import { z } from 'zod';

// Request validation schema
const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  newPlanKey: z.enum(['pro', 'team', 'enterprise']),
  newBillingInterval: z.enum(['monthly', 'yearly']).optional(),
  prorationBehavior: z.enum(['create_prorations', 'none', 'always_invoice']).optional().default('create_prorations'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify subscription ownership
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan, subscription_status, stripe_subscription_id, stripe_customer_id, team_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if subscription ID matches user's subscription
    if (profile.stripe_subscription_id !== validatedData.subscriptionId) {
      // Check if it's a team subscription
      if (profile.team_id) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('stripe_subscription_id, owner_id')
          .eq('id', profile.team_id)
          .single();

        if (teamError || team.stripe_subscription_id !== validatedData.subscriptionId) {
          return NextResponse.json(
            { error: 'Subscription not found or access denied' },
            { status: 404 }
          );
        }

        // Verify user has permission to modify team subscription
        if (team.owner_id !== user.id) {
          const userRole = profile.role || 'team_member';
          if (!['team_manager', 'enterprise_manager', 'admin', 'super_admin'].includes(userRole)) {
            return NextResponse.json(
              { error: 'Insufficient permissions to modify team subscription' },
              { status: 403 }
            );
          }
        }
      } else {
        return NextResponse.json(
          { error: 'Subscription not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Validate plan change logic
    const currentPlan = profile.subscription_plan;
    const newPlan = validatedData.newPlanKey;

    // Business rules for plan changes
    if (profile.team_id && newPlan === 'pro') {
      return NextResponse.json(
        { error: 'Cannot downgrade team subscription to Pro plan. Use team or enterprise plan.' },
        { status: 400 }
      );
    }

    if (!profile.team_id && ['team', 'enterprise'].includes(newPlan)) {
      return NextResponse.json(
        { error: 'Individual users cannot upgrade to team/enterprise plans without joining a team' },
        { status: 400 }
      );
    }

    // Get current and new plan details for comparison
    const currentPlanDetails = SUBSCRIPTION_PLANS[currentPlan];
    const newPlanDetails = SUBSCRIPTION_PLANS[newPlan];

    // Check if this is actually a change
    const currentBilling = validatedData.newBillingInterval || 'monthly'; // Default assumption
    if (currentPlan === newPlan && currentBilling === validatedData.newBillingInterval) {
      return NextResponse.json(
        { error: 'No changes detected in subscription plan or billing interval' },
        { status: 400 }
      );
    }

    // Preview the invoice change if moving to a higher tier
    const subscriptionService = new SubscriptionService();
    const isUpgrade = newPlanDetails.price.monthly > currentPlanDetails.price.monthly;
    
    let invoicePreview = null;
    if (isUpgrade && profile.stripe_customer_id) {
      try {
        const billingInterval = validatedData.newBillingInterval || 'monthly';
        const newPriceId = billingInterval === 'yearly' 
          ? newPlanDetails.yearlyPriceId 
          : newPlanDetails.monthlyPriceId;
          
        invoicePreview = await subscriptionService.previewInvoice({
          customerId: profile.stripe_customer_id,
          subscriptionId: validatedData.subscriptionId,
          newPriceId,
          prorationDate: Math.floor(Date.now() / 1000),
        });
      } catch (error) {
        console.error('Failed to generate invoice preview:', error);
        // Continue without preview - not critical
      }
    }

    // Update subscription
    const updatedSubscription = await subscriptionService.updateSubscription({
      subscriptionId: validatedData.subscriptionId,
      newPlanKey: validatedData.newPlanKey,
      newBillingInterval: validatedData.newBillingInterval,
      prorationBehavior: validatedData.prorationBehavior,
    });

    console.log(`Subscription updated: ${validatedData.subscriptionId} for user ${user.id}, new plan: ${newPlan}`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        plan: newPlan,
        billingInterval: updatedSubscription.billingInterval,
        status: updatedSubscription.status,
        currentPeriodStart: updatedSubscription.currentPeriodStart,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        amount: newPlanDetails.price[updatedSubscription.billingInterval],
        features: newPlanDetails.features,
        nextInvoiceDate: updatedSubscription.nextInvoiceDate,
      },
      changeDetails: {
        previousPlan: currentPlan,
        newPlan,
        isUpgrade,
        prorationApplied: validatedData.prorationBehavior === 'create_prorations',
        invoicePreview,
      },
    });

  } catch (error) {
    console.error('Update subscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}