import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { generateProofForOrder, getUserEmail } from '@/lib/orders/generate-proof'
import { buildOrderInsert } from '@/lib/orders/order-insert'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { checkoutPaymentError, loadTrustedCheckout } from '@/lib/orders/trusted-checkout'
import { stripeCheckoutMetadata } from '@/lib/payments/intent-metadata'
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

    const supabase = createClient()
    const priced = await loadTrustedCheckout(
      supabase,
      userId,
      orderState as Record<string, unknown>,
      await loadPricingConfig(supabase)
    )
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status })
    }
    const serverTotal = priced.total
    let pi: Stripe.PaymentIntent
    try {
      pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    } catch {
      return NextResponse.json({ error: 'Payment could not be verified. Please restart checkout.' }, { status: 402 })
    }
    if (pi.status !== 'requires_capture') {
      return NextResponse.json({ error: `Payment is not authorized (status: ${pi.status}).` }, { status: 402 })
    }
    if (pi.metadata?.user_id !== userId) {
      return NextResponse.json({ error: 'Payment does not belong to this account.' }, { status: 403 })
    }
    const mismatch = checkoutPaymentError(pi, priced, userId)
    if (mismatch) return NextResponse.json({ error: mismatch.error }, { status: mismatch.status })

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()
    if (existingOrder?.id) {
      return NextResponse.json({ error: 'This payment has already been used' }, { status: 409 })
    }

    const now = new Date().toISOString()
    const insert = buildOrderInsert(
      { ...priced.snapshot, payment: { paymentIntentId, amount: pi.amount / 100, currency: pi.currency, status: 'authorized', quoteRevision: priced.quoteRevision } },
      userId,
      { paymentIntentId, amountAuthorized: pi.amount / 100 },
      now
    )
    insert.record_count = priced.recordCount
    insert.total_cost = serverTotal
    insert.cost_per_piece =
      priced.recordCount > 0 ? Number((serverTotal / priced.recordCount).toFixed(4)) : null
    insert.metadata = {
      ...insert.metadata,
      pricing_inputs: priced.pricingInputs,
      validation_job_id: priced.jobId,
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(insert)
      .select('id')
      .single()

    if (orderError) {
      if (orderError.code === '23505') {
        return NextResponse.json({ error: 'This payment has already been used' }, { status: 409 })
      }
      throw orderError
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: stripeCheckoutMetadata(userId, priced.pricingInputs, order.id),
    })

    const email = await getUserEmail(userId)
    await trySendEmail(
      email,
      orderConfirmationEmail({
        orderId: order.id,
        shortId: order.id.split('-')[0].toUpperCase(),
        total: serverTotal,
        recordCount: priced.recordCount,
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
