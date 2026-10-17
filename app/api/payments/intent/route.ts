import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { loadTrustedCheckout } from '@/lib/orders/trusted-checkout'
import { stripeCheckoutMetadata } from '@/lib/payments/intent-metadata'
import { rateLimitResponse } from '@/lib/rate-limit/request-guard'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const PaymentIntentSchema = z.object({
  orderState: z.record(z.unknown()),
  // Accepted for backwards compatibility with the wizard, then ignored.
  amount: z.number().optional()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const limited = await rateLimitResponse('payments-intent', req, 20, 60, {
      userId,
      failureMode: 'open',
    })
    if (limited) return limited

    const body = await req.json()
    const { orderState } = PaymentIntentSchema.parse(body)

    const supabase = createClient()
    const priced = await loadTrustedCheckout(
      supabase,
      userId,
      orderState,
      await loadPricingConfig(supabase)
    )
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status })
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = userProfile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId }
      })
      customerId = customer.id
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: priced.amountCents,
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual',
      payment_method_types: ['card'],
      metadata: stripeCheckoutMetadata(userId, priced.pricingInputs),
      description: `Direct Mail Order - ${priced.mailingOptions.serviceLevel.replace('_', ' ')} service`
    }, {
      idempotencyKey: `checkout:${userId}:${priced.quoteRevision}`.slice(0, 255),
    })

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: priced.total,
      pricing: priced.pricing,
      customerId
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Payment intent creation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Payment intent creation failed' },
      { status: 500 }
    )
  }
})
