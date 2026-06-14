/**
 * Stripe Webhooks Handler
 *
 * Verifies and processes Stripe payment_intent events to reconcile order
 * payment state in the consolidated inline-payment model. The order's
 * authoritative payment status is set synchronously at authorize/approve;
 * this webhook is the backstop that re-syncs the `orders` row (by
 * stripe_payment_intent_id) if an API response was ever lost. It does NOT
 * advance fulfillment status (order_status) to avoid regressing an order that
 * has already shipped/completed — it only writes the money facts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/payments/stripe-config'
import { createClient } from '@/utils/supabase/service'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  validateWebhookIp,
  checkWebhookRateLimit,
  logWebhookSecurity,
} from '@/lib/webhooks/security'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const stripeWebhookIps = [
  '18.245.8.0/26',
  '3.130.192.231/32',
  '13.235.14.237/32',
  '13.235.122.149/32',
  '18.211.135.69/32',
  '3.89.151.48/32',
  '54.187.174.169/32',
  '54.187.205.235/32',
  '54.187.216.72/32',
]

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
}

// Node.js runtime for crypto-based signature verification.
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  try {
    if (process.env.NODE_ENV === 'production' && !validateWebhookIp(request, stripeWebhookIps)) {
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { valid: false, error: 'IP not in allowlist' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = checkWebhookRateLimit(clientIp, 60, 60000)
    if (!rateLimitResult.allowed) {
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { valid: false, error: 'Rate limit exceeded' })
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const body = await request.text()
    const signature = (await headers()).get('stripe-signature')
    if (!signature) {
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { valid: false, error: 'Missing Stripe signature' })
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown signature error'
      console.error('Webhook signature verification failed:', errorMsg)
      logWebhookSecurity(request, '/api/payments/webhooks/stripe', { valid: false, error: `Invalid signature: ${errorMsg}` })
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    logWebhookSecurity(request, '/api/payments/webhooks/stripe', { valid: true })
    console.log(`Received webhook event: ${event.type} (${event.id})`)

    const processed = await processWebhookEvent(event)
    return NextResponse.json({ received: true, event_type: event.type, event_id: event.id, processed })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown processing error'
    console.error('Webhook processing error:', errorMsg)
    logWebhookSecurity(request, '/api/payments/webhooks/stripe', { valid: false, error: `Processing failed: ${errorMsg}` })
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/** Idempotent dispatch: record the event, process, mark processed. */
async function processWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const supabase = createClient()

  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('stripe_event_id', event.id)
    .single()

  if (existingEvent?.processed_at) {
    console.log(`Event ${event.id} already processed, skipping`)
    return true
  }
  if (!existingEvent) {
    await supabase.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      created_at: new Date().toISOString(),
    })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
      break
    case 'payment_intent.payment_failed':
      await setOrderPaymentStatus((event.data.object as Stripe.PaymentIntent).id, 'failed', supabase)
      break
    case 'payment_intent.canceled':
      await setOrderPaymentStatus((event.data.object as Stripe.PaymentIntent).id, 'canceled', supabase)
      break
    default:
      console.log(`Unhandled webhook event type: ${event.type}`)
      break
  }

  await supabase
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id)

  return true
}

/**
 * For manual-capture PIs, payment_intent.succeeded means the charge was
 * captured — reconcile the order's money facts (payment_status + amount_captured).
 * Does not touch order_status (fulfillment is driven elsewhere).
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: SupabaseClient
): Promise<void> {
  const amountCaptured =
    typeof paymentIntent.amount_received === 'number' ? paymentIntent.amount_received / 100 : null

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: 'captured', amount_captured: amountCaptured })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .neq('payment_status', 'captured')

  if (error) console.error('Webhook: failed to reconcile captured order:', error)
}

/** Mark the order's payment_status for failed/canceled PIs. */
async function setOrderPaymentStatus(
  paymentIntentId: string,
  status: 'failed' | 'canceled',
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: status })
    .eq('stripe_payment_intent_id', paymentIntentId)

  if (error) console.error(`Webhook: failed to set order payment_status=${status}:`, error)
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
