import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { generateProofForOrder, getUserEmail } from '@/lib/orders/generate-proof'
import { buildOrderInsert, extractTotal, extractRecordCount } from '@/lib/orders/order-insert'
import { trySendEmail } from '@/lib/email'
import { orderConfirmationEmail } from '@/lib/email/templates'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })

const SubmitOrderSchema = z.object({
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { orderState } = SubmitOrderSchema.parse(body)

    const payment = (orderState as Record<string, unknown>).payment as
      | { paymentIntentId?: string; amount?: number }
      | undefined

    const paymentIntentId = payment?.paymentIntentId
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment must be authorized before submitting' },
        { status: 400 }
      )
    }

    // SECURITY: verify the PaymentIntent server-side against Stripe (never trust
    // the client). Must be authorized (manual-capture → requires_capture), owned
    // by this user, and its amount must match the server-computed order total.
    const serverTotal = extractTotal(orderState as Record<string, unknown>)
    let pi: Stripe.PaymentIntent
    try {
      pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    } catch {
      return NextResponse.json({ error: 'Payment could not be verified. Please restart checkout.' }, { status: 402 })
    }
    if (pi.status !== 'requires_capture') {
      return NextResponse.json({ error: `Payment is not authorized (status: ${pi.status}).` }, { status: 402 })
    }
    if (pi.metadata?.user_id && pi.metadata.user_id !== userId) {
      return NextResponse.json({ error: 'Payment does not belong to this account.' }, { status: 403 })
    }
    if (Math.abs(pi.amount - Math.round(serverTotal * 100)) > 1) {
      return NextResponse.json({ error: 'Authorized amount does not match the order total.' }, { status: 402 })
    }

    const supabase = createClient()
    const now = new Date().toISOString()

    // Normalized (DB1-model) insert: queryable columns + payment inline on the
    // order; full wizard state retained in metadata for proof/design rendering.
    // amountAuthorized comes from Stripe (verified), not the client.
    const insert = buildOrderInsert(
      orderState as Record<string, unknown>,
      userId,
      { paymentIntentId, amountAuthorized: pi.amount / 100 },
      now
    )

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(insert)
      .select('id')
      .single()

    if (orderError) throw orderError

    // Confirmation email + official proof — loud-on-failure but non-fatal.
    const email = await getUserEmail(userId)
    await trySendEmail(
      email,
      orderConfirmationEmail({
        orderId: order.id,
        shortId: order.id.split('-')[0].toUpperCase(),
        total: extractTotal(orderState as Record<string, unknown>),
        recordCount: extractRecordCount(orderState as Record<string, unknown>),
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      })
    )

    const proof = await generateProofForOrder(order.id, userId)
    if (!proof.ok) {
      console.error(`Proof generation deferred for order ${order.id}: ${proof.error}`)
    }

    return NextResponse.json({
      orderId: order.id,
      status: 'submitted',
      proofUrl: proof.proofUrl ?? null,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Submit order error:', err)
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
})
