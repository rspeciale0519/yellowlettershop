import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { withAuth } from '@/lib/auth/middleware'
import { requireStripe } from '@/lib/payments/stripe-config'
import { CustomerService } from '@/lib/payments/customer-service'

/**
 * SetupIntent — saves a card WITHOUT charging it.
 *
 * The order flow authorizes against a saved payment method, so a first-time
 * customer needs a way to attach one before checkout can proceed. Card data
 * goes straight from the browser to Stripe via the Payment Element; nothing
 * sensitive touches this server.
 *
 * `usage: 'off_session'` is deliberate: the saved card must be re-usable when
 * the customer is not present — required for drip sequences (each touch
 * authorizes days ahead) and for re-authorizing before vendor-gated capture
 * when a proof cycle outlives Stripe's ~7-day authorization window.
 */
export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  try {
    const stripe = requireStripe()
    const customerId = await new CustomerService().ensureCustomer(userId)

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      // Card only: the checkout path authorizes with manual capture, which
      // redirect-based methods do not support.
      payment_method_types: ['card'],
      metadata: { user_id: userId },
    })

    if (!setupIntent.client_secret) {
      throw new Error('Stripe returned a SetupIntent without a client secret')
    }

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (error) {
    console.error('Setup intent creation error:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: `Stripe error: ${error.message}` }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start card setup' },
      { status: 500 }
    )
  }
})
