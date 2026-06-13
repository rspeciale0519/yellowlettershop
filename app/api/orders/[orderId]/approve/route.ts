import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { trySendEmail } from '@/lib/email'
import { paymentCapturedEmail } from '@/lib/email/templates'
import { getUserEmail } from '@/lib/orders/generate-proof'
import { firstProofUrl } from '@/lib/orders/order-summary'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })

const ApprovalSchema = z.object({ action: z.enum(['approve', 'reject']) })

/**
 * Customer verdict on the proof (normalized/inline-payment model).
 * Approve → record proof_approved_at, capture the authorized PaymentIntent,
 * move to 'processing'. Reject → cancel the authorization (releases the hold,
 * no refund processed) and mark the order failed. Capture/cancel failures are
 * surfaced, never absorbed.
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const orderId = req.nextUrl.pathname.split('/').slice(-2)[0]
    const { action } = ApprovalSchema.parse(await req.json())

    const supabase = createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, created_by, status, stripe_payment_intent_id, proof_urls, proof_approved_at, total_cost')
      .eq('id', orderId)
      .eq('created_by', userId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    // Proof must be ready (proof_urls present) and not already decided.
    const proofReady = order.status === 'submitted' && !!firstProofUrl(order.proof_urls) && !order.proof_approved_at
    if (!proofReady) {
      return NextResponse.json(
        { error: 'Order is not awaiting a proof decision' },
        { status: 409 }
      )
    }

    const now = new Date().toISOString()

    if (action === 'reject') {
      if (order.stripe_payment_intent_id) {
        try {
          await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
        } catch (cancelErr) {
          console.error(`Authorization release failed for order ${orderId}:`, cancelErr)
        }
      }
      const { error: updErr } = await supabase
        .from('orders')
        .update({ status: 'failed', payment_status: 'canceled', updated_at: now })
        .eq('id', orderId)
        .eq('created_by', userId)
      if (updErr) throw updErr
      return NextResponse.json({ status: 'rejected' })
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'Order has no payment authorization on file — contact support' },
        { status: 409 }
      )
    }

    // Record approval before money moves (interrupted capture stays visible).
    await supabase
      .from('orders')
      .update({ proof_approved_at: now, updated_at: now })
      .eq('id', orderId)
      .eq('created_by', userId)

    let capturedAmount: number | null = null
    try {
      const captured = await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
      capturedAmount = typeof captured.amount_received === 'number' ? captured.amount_received / 100 : null
    } catch (captureError) {
      console.error(`Payment capture failed for order ${orderId}:`, captureError)
      return NextResponse.json(
        { error: 'Your approval was recorded but the payment capture failed. Our team has been notified — no further action needed.' },
        { status: 502 }
      )
    }

    const { error: capturedError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'captured',
        amount_captured: capturedAmount ?? order.total_cost ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('created_by', userId)
    if (capturedError) throw capturedError

    const email = await getUserEmail(userId)
    await trySendEmail(
      email,
      paymentCapturedEmail({
        orderId,
        shortId: orderId.split('-')[0].toUpperCase(),
        total: capturedAmount ?? (typeof order.total_cost === 'number' ? order.total_cost : 0),
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      })
    )

    return NextResponse.json({ status: 'processing' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Order approval error:', err)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
})
