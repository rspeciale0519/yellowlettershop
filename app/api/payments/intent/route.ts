import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import Stripe from 'stripe'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { loadOrderQuote, QuoteError } from '@/lib/orders/server-quote'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const PaymentIntentSchema = z.object({ orderState: z.record(z.unknown()) })

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { orderState } = PaymentIntentSchema.parse(await req.json())
    const supabase = createClient()
    const quote = await loadOrderQuote(supabase, userId, orderState, await loadPricingConfig(supabase))
    const totalAmount = quote.result.total

    // Get or create Stripe customer
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = userProfile?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer (email lives on auth.users, not user_profiles)
      const customer = await stripe.customers.create({
        metadata: {
          user_id: userId
        }
      })
      
      customerId = customer.id
      
      // Save customer ID to profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId)
    }
    
    // Create payment intent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: quote.amountCents,
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual', // This is key for authorization-only
      payment_method_types: ['card'],
      metadata: {
        user_id: userId,
        order_type: 'direct_mail',
        service_level: quote.snapshot.mailingOptions.serviceLevel,
        record_count: quote.result.recordCount.toString(),
        quote_revision: quote.pricing.quoteRevision,
        design_revision: quote.pricing.designRevision
      },
      description: `Direct Mail Order - ${quote.snapshot.mailingOptions.serviceLevel.replace('_', ' ')} service`
    })
    
    // Inline-payment model: the PaymentIntent's authoritative state lives in
    // Stripe (carries metadata.user_id + amount). No separate payment_intents
    // table — the order row is created at /api/orders/submit, which verifies
    // this PI against Stripe and persists stripe_payment_intent_id + amounts on
    // the order itself.

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      pricing: quote.pricing,
      quoteRevision: quote.pricing.quoteRevision,
      customerId
    })
    
  } catch (error) {
    if (error instanceof QuoteError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Payment intent creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment intent creation failed' },
      { status: 500 }
    )
  }
})