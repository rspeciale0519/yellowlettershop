import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { computeServerOrderTotal } from '@/lib/orders/server-total'
import { rateLimitResponse } from '@/lib/rate-limit/request-guard'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const PaymentIntentSchema = z.object({
  orderState: z.object({
    accuzipValidation: z.object({
      deliverableRecords: z.number()
    }).optional(),
    mailingOptions: z.object({
      serviceLevel: z.string(),
      mailPieceFormat: z.string().optional(),
      paperStock: z.string().optional(),
      finish: z.string().optional(),
      postageType: z.string().optional(),
      includePostage: z.boolean().optional()
    }).optional()
  }),
  // Accepted for backwards compatibility with the wizard, then ignored.
  // The charged amount is always recomputed server-side.
  amount: z.number().optional()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const limited = await rateLimitResponse('payments-intent', req, 20, 60)
    if (limited) return limited

    const body = await req.json()
    const { orderState } = PaymentIntentSchema.parse(body)
    
    const supabase = createClient()
    const priced = computeServerOrderTotal(
      orderState as Record<string, unknown>,
      await loadPricingConfig(supabase)
    )
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: 400 })
    }
    const totalAmount = priced.total
    
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
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual', // This is key for authorization-only
      payment_method_types: ['card'],
      metadata: {
        user_id: userId,
        order_type: 'direct_mail',
        service_level: orderState.mailingOptions?.serviceLevel || 'unknown',
        record_count: priced.recordCount.toString()
      },
      description: `Direct Mail Order - ${orderState.mailingOptions?.serviceLevel?.replace('_', ' ')} service`
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