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
import { mapStripeStatusToDb } from '@/lib/payments/types';
import type { PaymentStatus, SubscriptionStatus } from '@/types/supabase-comprehensive';
import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  validateWebhookIp, 
  checkWebhookRateLimit, 
  logWebhookSecurity 
} from '@/lib/webhooks/security';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripeWebhookIps = [
  '18.245.8.0/26',
  '3.130.192.231/32',
  '13.235.14.237/32',
  '13.235.122.149/32',
  '18.211.135.69/32',
  '3.89.151.48/32',
  '54.187.174.169/32',
  '54.187.205.235/32',
  '54.187.216.72/32'
];

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

// Use Node.js runtime for crypto operations and webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   request.ip || 'unknown';

  try {
    // 1. Validate Stripe IP allowlist (in production)
    if (process.env.NODE_ENV === 'production' && !validateWebhookIp(request, stripeWebhookIps)) {
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { 
        valid: false, 
        error: 'IP not in allowlist' 
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check rate limiting
    const rateLimitResult = checkWebhookRateLimit(clientIp, 60, 60000); // 60 requests per minute
    if (!rateLimitResult.allowed) {
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { 
        valid: false, 
        error: 'Rate limit exceeded' 
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // 3. Get the raw body for signature verification
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { 
        valid: false, 
        error: 'Missing Stripe signature' 
      });
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // 4. Verify webhook signature with enhanced error handling
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown signature error';
      console.error('Webhook signature verification failed:', errorMsg);
      
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { 
        valid: false, 
        error: `Invalid signature: ${errorMsg}` 
      });
      
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // 5. Log successful validation
    logWebhookSecurity(request, '/api/payments/webhooks/stripe', { 
      valid: true 
    });

    console.log(`Received webhook event: ${event.type} (${event.id})`);

    // 6. Process the event with idempotency check
    const processResult = await processWebhookEvent(event);
    
    return NextResponse.json({ 
      received: true, 
      event_type: event.type,
      event_id: event.id,
      processed: processResult 
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';
    console.error('Webhook processing error:', errorMsg);
    
    logWebhookSecurity(request, '/api/payments/webhooks/stripe', { 
      valid: false, 
      error: `Processing failed: ${errorMsg}` 
    });
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process individual webhook events with idempotency
 */
async function processWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const supabase = createClient();

  // Check if this event has already been processed (idempotency)
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed_at) {
    console.log(`Event ${event.id} already processed, skipping`);
    return true;
  }

  // Record the event processing attempt
  if (!existingEvent) {
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: null,
        created_at: new Date().toISOString()
      });
  }

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

  // Mark event as successfully processed
  await supabase
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id);

  return true;
}

/**
 * Payment Intent Event Handlers
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
): Promise<void> {
  const status: PaymentStatus = paymentIntent.capture_method === 'manual' 
    ? (paymentIntent.charges.data[0]?.captured ? 'captured' : 'authorized')
    : 'captured';

  const updateData: {
    status: PaymentStatus;
    payment_method_id: string | null;
    authorized_at?: string;
    captured_at?: string;
  } = {
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
  supabase: SupabaseClient
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
  supabase: SupabaseClient
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
  supabase: SupabaseClient
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
  supabase: SupabaseClient
): Promise<void> {
  const userId = subscription.metadata.userId;
  const teamId = subscription.metadata.teamId;
  const plan = subscription.metadata.plan;
  const status = mapStripeStatusToDb(subscription.status);

  if (teamId) {
    const updateData: { plan: string } = { plan };
    
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
  supabase: SupabaseClient
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
  supabase: SupabaseClient
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
  supabase: SupabaseClient
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
  supabase: SupabaseClient
): Promise<void> {
  // Update customer information in profiles
  const updateData: { full_name?: string } = {};
  
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
  supabase: SupabaseClient
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

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}