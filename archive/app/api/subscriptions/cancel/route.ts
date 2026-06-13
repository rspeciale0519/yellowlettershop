/**
 * Cancel Subscription API Route
 * 
 * Cancels subscription either immediately or at the end of the billing period.
 * Handles both individual and team subscription cancellations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionService } from '@/lib/payments/subscription-service';
import { PaymentServiceError } from '@/lib/payments/payment-service';
import { z } from 'zod';

// Request validation schema
const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(), // Optional cancellation reason for analytics
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = cancelSubscriptionSchema.parse(body);

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
      .select('subscription_plan, stripe_subscription_id, team_id, role')
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
        
        // Team owner can always cancel
        if (team.owner_id === user.id) {
          hasPermission = true;
        }
        // Team managers can cancel in some cases
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

    // Additional validation for immediate cancellation
    if (!validatedData.cancelAtPeriodEnd) {
      // Only allow immediate cancellation for certain roles or within grace period
      const isAdmin = ['admin', 'super_admin'].includes(profile.role || '');
      if (!isAdmin && subscriptionContext === 'team') {
        return NextResponse.json(
          { error: 'Team subscriptions can only be cancelled at period end unless you are an admin' },
          { status: 403 }
        );
      }
    }

    // Get current subscription details before cancellation
    const subscriptionService = new SubscriptionService();
    const currentSubscription = await subscriptionService.getSubscription(validatedData.subscriptionId);

    // Cancel subscription
    await subscriptionService.cancelSubscription(
      validatedData.subscriptionId,
      validatedData.cancelAtPeriodEnd
    );

    // Log cancellation reason if provided
    if (validatedData.reason) {
      // Insert cancellation feedback (this could be used for analytics)
      const { error: feedbackError } = await supabase
        .from('user_analytics')
        .insert({
          user_id: user.id,
          event_type: 'subscription_cancelled',
          metadata: {
            subscription_id: validatedData.subscriptionId,
            subscription_context: subscriptionContext,
            cancel_at_period_end: validatedData.cancelAtPeriodEnd,
            reason: validatedData.reason,
            previous_plan: profile.subscription_plan,
          },
        });

      if (feedbackError) {
        console.error('Failed to log cancellation reason:', feedbackError);
      }
    }

    // If team subscription, notify team members
    if (subscriptionContext === 'team' && profile.team_id) {
      // Get team members to notify
      const { data: teamMembers } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .eq('team_id', profile.team_id)
        .neq('user_id', user.id);

      // Log notification events (actual email notifications would be handled by a separate service)
      if (teamMembers && teamMembers.length > 0) {
        const notificationPromises = teamMembers.map(member => 
          supabase
            .from('user_analytics')
            .insert({
              user_id: member.user_id,
              event_type: 'subscription_cancelled_notification',
              metadata: {
                cancelled_by: user.id,
                subscription_id: validatedData.subscriptionId,
                cancel_at_period_end: validatedData.cancelAtPeriodEnd,
                effective_date: validatedData.cancelAtPeriodEnd 
                  ? currentSubscription.currentPeriodEnd.toISOString()
                  : new Date().toISOString(),
              },
            })
        );

        await Promise.allSettled(notificationPromises);
      }
    }

    console.log(
      `Subscription cancelled: ${validatedData.subscriptionId} by user ${user.id}, ` +
      `context: ${subscriptionContext}, at period end: ${validatedData.cancelAtPeriodEnd}`
    );

    return NextResponse.json({
      success: true,
      message: validatedData.cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at the end of the current billing period'
        : 'Subscription has been cancelled immediately',
      cancellationDetails: {
        subscriptionId: validatedData.subscriptionId,
        cancelAtPeriodEnd: validatedData.cancelAtPeriodEnd,
        effectiveDate: validatedData.cancelAtPeriodEnd 
          ? currentSubscription.currentPeriodEnd
          : new Date(),
        accessUntil: validatedData.cancelAtPeriodEnd 
          ? currentSubscription.currentPeriodEnd
          : new Date(),
        subscriptionContext,
      },
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);

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