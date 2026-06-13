/**
 * Reactivate Subscription API Route
 * 
 * Reactivates a cancelled subscription that hasn't ended yet.
 * This removes the cancel_at_period_end flag from the subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionService } from '@/lib/payments/subscription-service';
import { PaymentServiceError } from '@/lib/payments/payment-service';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/stripe-config';
import { z } from 'zod';

// Request validation schema
const reactivateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = reactivateSubscriptionSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify subscription ownership and permissions
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan, subscription_status, stripe_subscription_id, team_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    let subscriptionContext: 'individual' | 'team' = 'individual';
    let hasPermission = false;

    // Check individual subscription
    if (profile.stripe_subscription_id === validatedData.subscriptionId) {
      hasPermission = true;
      subscriptionContext = 'individual';
    }
    // Check team subscription
    else if (profile.team_id) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('stripe_subscription_id, owner_id')
        .eq('id', profile.team_id)
        .single();

      if (!teamError && team.stripe_subscription_id === validatedData.subscriptionId) {
        subscriptionContext = 'team';
        
        // Team owner can always reactivate
        if (team.owner_id === user.id) {
          hasPermission = true;
        }
        // Team managers can reactivate in some cases
        else if (['team_manager', 'enterprise_manager', 'admin', 'super_admin'].includes(profile.role || '')) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Subscription not found or insufficient permissions' },
        { status: 403 }
      );
    }

    // Get current subscription to verify it can be reactivated
    const subscriptionService = new SubscriptionService();
    const currentSubscription = await subscriptionService.getSubscription(validatedData.subscriptionId);

    // Check if subscription is in a state that can be reactivated
    if (!['active', 'past_due'].includes(currentSubscription.status)) {
      return NextResponse.json(
        { error: 'Subscription cannot be reactivated in its current state' },
        { status: 400 }
      );
    }

    // Check if subscription is actually cancelled (has cancel_at_period_end = true)
    if (!currentSubscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Check if subscription has already ended
    if (new Date() > currentSubscription.currentPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription has already ended and cannot be reactivated. Create a new subscription instead.' },
        { status: 400 }
      );
    }

    // Reactivate subscription
    const reactivatedSubscription = await subscriptionService.reactivateSubscription(
      validatedData.subscriptionId
    );

    // Log reactivation event
    const { error: analyticsError } = await supabase
      .from('user_analytics')
      .insert({
        user_id: user.id,
        event_type: 'subscription_reactivated',
        metadata: {
          subscription_id: validatedData.subscriptionId,
          subscription_context: subscriptionContext,
          plan: reactivatedSubscription.plan,
          billing_interval: reactivatedSubscription.billingInterval,
        },
      });

    if (analyticsError) {
      console.error('Failed to log reactivation event:', analyticsError);
    }

    // If team subscription, notify team members
    if (subscriptionContext === 'team' && profile.team_id) {
      const { data: teamMembers } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .eq('team_id', profile.team_id)
        .neq('user_id', user.id);

      if (teamMembers && teamMembers.length > 0) {
        const notificationPromises = teamMembers.map(member => 
          supabase
            .from('user_analytics')
            .insert({
              user_id: member.user_id,
              event_type: 'subscription_reactivated_notification',
              metadata: {
                reactivated_by: user.id,
                subscription_id: validatedData.subscriptionId,
                plan: reactivatedSubscription.plan,
              },
            })
        );

        await Promise.allSettled(notificationPromises);
      }
    }

    // Get plan details for response
    const planDetails = SUBSCRIPTION_PLANS[reactivatedSubscription.plan];

    console.log(
      `Subscription reactivated: ${validatedData.subscriptionId} by user ${user.id}, ` +
      `context: ${subscriptionContext}`
    );

    return NextResponse.json({
      success: true,
      message: 'Subscription has been reactivated successfully',
      subscription: {
        id: reactivatedSubscription.id,
        plan: reactivatedSubscription.plan,
        billingInterval: reactivatedSubscription.billingInterval,
        status: reactivatedSubscription.status,
        currentPeriodStart: reactivatedSubscription.currentPeriodStart,
        currentPeriodEnd: reactivatedSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: reactivatedSubscription.cancelAtPeriodEnd, // Should be false now
        amount: planDetails.price[reactivatedSubscription.billingInterval],
        features: planDetails.features,
        nextInvoiceDate: reactivatedSubscription.nextInvoiceDate,
      },
      reactivationDetails: {
        subscriptionId: validatedData.subscriptionId,
        subscriptionContext,
        reactivatedAt: new Date(),
        continuesUntil: reactivatedSubscription.currentPeriodEnd,
      },
    });

  } catch (error) {
    console.error('Reactivate subscription error:', error);

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