import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })

const AuthorizePaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string(),
  orderState: z.any(),
})

/**
 * Authorize (not capture) a PaymentIntent for the order wizard. Inline-payment
 * model: the PI's authoritative state lives in Stripe; we verify it belongs to
 * this user, attach the chosen card, and confirm with manual capture so it
 * lands in `requires_capture`. The order row is created later by
 * /api/orders/submit (which re-verifies this PI). No DB writes here.
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { paymentIntentId, paymentMethodId } = AuthorizePaymentSchema.parse(await req.json())

    // Verify the PI belongs to this user (metadata set at creation).
    let intent: Stripe.PaymentIntent
    try {
      intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    } catch {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
    }
    if (intent.metadata?.user_id && intent.metadata.user_id !== userId) {
      return NextResponse.json({ error: 'Payment does not belong to this account' }, { status: 403 })
    }

    // Attach the payment method to the PI's customer (idempotent).
    if (intent.customer && typeof intent.customer === 'string') {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: intent.customer })
      } catch (attachError) {
        if (
          !(attachError instanceof Stripe.errors.StripeError) ||
          !attachError.message.includes('already been attached')
        ) {
          throw attachError
        }
      }
    }

    const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/payment-return`,
    })

    if (confirmed.status === 'requires_action') {
      return NextResponse.json({
        status: 'requires_action',
        clientSecret: confirmed.client_secret,
        nextAction: confirmed.next_action,
      })
    }

    if (confirmed.status === 'requires_capture' || confirmed.status === 'succeeded') {
      // Authorized (held). The wizard now calls /api/orders/submit to create
      // the order; capture happens later at proof approval.
      return NextResponse.json({ status: 'succeeded', paymentIntentId })
    }

    return NextResponse.json(
      { error: `Payment could not be authorized (status: ${confirmed.status})` },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: `Stripe error: ${error.message}` }, { status: 400 })
    }
    console.error('Payment authorization error:', error)
    return NextResponse.json({ error: 'Payment authorization failed' }, { status: 500 })
  }
})
