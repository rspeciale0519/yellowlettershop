/**
 * Create Subscription API Route
 * 
 * Creates a new subscription for a user or team.
 * Handles plan selection, payment method setup, and billing configuration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionService } from '@/lib/payments/subscription-service';
import { PaymentServiceError } from '@/lib/payments/payment-service';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/stripe-config';
import { z } from 'zod';

// Request validation schema
const createSubscriptionSchema = z.object({
  planKey: z.enum(['pro', 'team', 'enterprise']),
  billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
  paymentMethodId: z.string().optional(),
  teamId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan, subscription_status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    if (profile.subscription_plan !== 'free' && profile.subscription_status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription. Use update endpoint to change plans.' },
        { status: 400 }
      );
    }

    // If creating team subscription, verify team ownership/admin access
    if (validatedData.teamId) {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, owner_id, plan')
        .eq('id', validatedData.teamId)
        .single();

      if (teamError || !team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      // Check if user is owner or team manager
      if (team.owner_id !== user.id) {
        const { data: membership } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .eq('team_id', validatedData.teamId)
          .single();

        if (!membership || !['team_manager', 'enterprise_manager'].includes(membership.role)) {
          return NextResponse.json(
            { error: 'Insufficient permissions to create team subscription' },
            { status: 403 }
          );
        }
      }

      // Validate plan is compatible with team
      if (validatedData.planKey === 'pro') {
        return NextResponse.json(
          { error: 'Pro plan is not available for teams. Use team or enterprise plan.' },
          { status: 400 }
        );
      }
    } else {
      // For individual subscriptions, validate plan compatibility
      if (['team', 'enterprise'].includes(validatedData.planKey)) {
        return NextResponse.json(
          { error: 'Team and enterprise plans require a team. Create or join a team first.' },
          { status: 400 }
        );
      }
    }

    // Create subscription
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.createSubscription({
      userId: user.id,
      planKey: validatedData.planKey,
      billingInterval: validatedData.billingInterval,
      paymentMethodId: validatedData.paymentMethodId,
      teamId: validatedData.teamId,
    });

    // Get plan details for response
    const planDetails = SUBSCRIPTION_PLANS[validatedData.planKey];

    console.log(`Subscription created: ${subscription.id} for user ${user.id}, plan: ${validatedData.planKey}`);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: validatedData.planKey,
        billingInterval: validatedData.billingInterval,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        amount: planDetails.price[validatedData.billingInterval],
        features: planDetails.features,
        nextInvoiceDate: subscription.nextInvoiceDate,
      },
    });

  } catch (error) {
    console.error('Create subscription error:', error);

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