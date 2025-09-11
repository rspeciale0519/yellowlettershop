/**
 * Stripe Webhooks Handler
 * 
 * Processes Stripe webhook events to keep database in sync with Stripe.
 * Handles payment and subscription lifecycle events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe-config';
import { createClient } from '@/utils/supabase/service';
import type { PaymentStatus, SubscriptionStatus } from '@/types/supabase-comprehensive';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    console.log(`Received webhook event: ${event.type} (${event.id})`);

    // Process the event
    await processWebhookEvent(event);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process individual webhook events
 */
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = createClient();

  switch (event.type) {
    // Payment Intent Events
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabase);
      break;

    case 'payment_intent.canceled':
      await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent, supabase);
      break;

    // Subscription Events
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
      break;

    // Invoice Events
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase);
      break;

    // Customer Events
    case 'customer.updated':
      await handleCustomerUpdated(event.data.object as Stripe.Customer, supabase);
      break;

    // Payment Method Events
    case 'payment_method.attached':
      await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod, supabase);
      break;

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
      break;
  }
}

/**
 * Payment Intent Event Handlers
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
): Promise<void> {
  const status: PaymentStatus = paymentIntent.capture_method === 'manual' 
    ? (paymentIntent.charges.data[0]?.captured ? 'captured' : 'authorized')
    : 'captured';

  const updateData: any = {
    status,
    payment_method_id: paymentIntent.payment_method as string || null,
  };

  if (status === 'authorized') {
    updateData.authorized_at = new Date().toISOString();
  } else {
    updateData.captured_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('payment_transactions')
    .update(updateData)
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Failed to update payment transaction:', error);
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: 'failed' as PaymentStatus,
      failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Failed to update failed payment:', error);
  }
}

async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      status: 'failed' as PaymentStatus,
      failure_reason: 'Payment canceled',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Failed to update canceled payment:', error);
  }
}

/**
 * Subscription Event Handlers
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<void> {
  const userId = subscription.metadata.userId;
  const teamId = subscription.metadata.teamId;
  const plan = subscription.metadata.plan;

  if (!userId && !teamId) {
    console.error('Subscription webhook missing user/team ID:', subscription.id);
    return;
  }

  const status = mapStripeStatusToDb(subscription.status);

  if (teamId) {
    const { error } = await supabase
      .from('teams')
      .update({
        stripe_subscription_id: subscription.id,
        plan: plan,
        // Note: teams table doesn't have a subscription_status field in the schema
      })
      .eq('id', teamId);

    if (error) {
      console.error('Failed to update team subscription:', error);
    }
  } else {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_plan: plan,
        subscription_status: status,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to update user subscription:', error);
    }
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<void> {
  const userId = subscription.metadata.userId;
  const teamId = subscription.metadata.teamId;
  const plan = subscription.metadata.plan;
  const status = mapStripeStatusToDb(subscription.status);

  if (teamId) {
    const updateData: any = { plan };
    
    const { error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update team subscription:', error);
    }
  } else if (userId) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_plan: plan,
        subscription_status: status,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update user subscription:', error);
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<void> {
  const userId = subscription.metadata.userId;
  const teamId = subscription.metadata.teamId;

  if (teamId) {
    const { error } = await supabase
      .from('teams')
      .update({
        stripe_subscription_id: null,
        plan: 'team', // Default team plan
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update team after subscription deletion:', error);
    }
  } else if (userId) {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        stripe_subscription_id: null,
        subscription_plan: 'free',
        subscription_status: 'cancelled',
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Failed to update user after subscription deletion:', error);
    }
  }
}

/**
 * Invoice Event Handlers
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
): Promise<void> {
  if (invoice.subscription) {
    // Log successful payment for analytics
    const { error } = await supabase
      .from('user_analytics')
      .insert({
        user_id: invoice.metadata?.userId || null,
        event_type: 'invoice_paid',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
        },
      });

    if (error) {
      console.error('Failed to log invoice payment:', error);
    }
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
): Promise<void> {
  if (invoice.subscription) {
    // Update subscription status to past_due
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: 'past_due' as SubscriptionStatus,
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Failed to update subscription to past_due:', error);
    }

    // Log failed payment for analytics
    const { error: analyticsError } = await supabase
      .from('user_analytics')
      .insert({
        user_id: invoice.metadata?.userId || null,
        event_type: 'invoice_payment_failed',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: invoice.subscription,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
        },
      });

    if (analyticsError) {
      console.error('Failed to log invoice payment failure:', analyticsError);
    }
  }
}

/**
 * Customer Event Handlers
 */
async function handleCustomerUpdated(
  customer: Stripe.Customer,
  supabase: any
): Promise<void> {
  // Update customer information in profiles
  const updateData: any = {};
  
  if (customer.name) {
    updateData.full_name = customer.name;
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('stripe_customer_id', customer.id);

    if (error) {
      console.error('Failed to update customer information:', error);
    }
  }
}

/**
 * Payment Method Event Handlers
 */
async function handlePaymentMethodAttached(
  paymentMethod: Stripe.PaymentMethod,
  supabase: any
): Promise<void> {
  // Log payment method attachment for analytics
  const { error } = await supabase
    .from('user_analytics')
    .insert({
      user_id: null, // We don't have direct user mapping here
      event_type: 'payment_method_attached',
      metadata: {
        payment_method_id: paymentMethod.id,
        payment_method_type: paymentMethod.type,
        customer_id: paymentMethod.customer,
      },
    });

  if (error) {
    console.error('Failed to log payment method attachment:', error);
  }
}

/**
 * Utility Functions
 */
function mapStripeStatusToDb(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    default:
      return 'active'; // Default fallback
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}