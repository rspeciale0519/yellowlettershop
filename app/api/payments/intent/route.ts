import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
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
  amount: z.number().optional()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { orderState, amount } = PaymentIntentSchema.parse(body)
    
    const supabase = createClient()
    
    // Calculate total amount if not provided
    let totalAmount = amount
    
    if (!totalAmount && orderState.mailingOptions && orderState.accuzipValidation) {
      // Call pricing calculation
      const pricingResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/orders/calculate-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          mailingOptions: orderState.mailingOptions,
          recordCount: orderState.accuzipValidation.deliverableRecords
        })
      })
      
      if (pricingResponse.ok) {
        const pricing = await pricingResponse.json()
        totalAmount = pricing.total
      }
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount' },
        { status: 400 }
      )
    }
    
    // Get or create Stripe customer
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('user_id', userId)
      .single()
    
    let customerId = userProfile?.stripe_customer_id
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userProfile?.email,
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
        record_count: orderState.accuzipValidation?.deliverableRecords?.toString() || '0'
      },
      description: `Direct Mail Order - ${orderState.mailingOptions?.serviceLevel?.replace('_', ' ')} service`
    })
    
    // Save payment intent to database
    const { error: saveError } = await supabase
      .from('payment_intents')
      .insert({
        id: paymentIntent.id,
        user_id: userId,
        stripe_customer_id: customerId,
        amount: totalAmount,
        currency: 'usd',
        status: paymentIntent.status,
        order_data: orderState,
        created_at: new Date().toISOString()
      })
    
    if (saveError) {
      console.error('Error saving payment intent:', saveError)
      // Don't fail the request, but log the error
    }
    
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