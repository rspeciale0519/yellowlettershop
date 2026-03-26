import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const AuthorizePaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string(),
  orderState: z.any()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { paymentIntentId, paymentMethodId, orderState } = AuthorizePaymentSchema.parse(body)
    
    const supabase = createClient()
    
    // Verify payment intent belongs to user
    const { data: paymentRecord, error: fetchError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('id', paymentIntentId)
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !paymentRecord) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }
    
    // Attach payment method to customer if not already attached
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: paymentRecord.stripe_customer_id
      })
    } catch (attachError) {
      // Payment method might already be attached, that's ok
      if (!(attachError instanceof Stripe.errors.StripeError) || 
          !attachError.message.includes('already been attached')) {
        throw attachError
      }
    }
    
    // Confirm payment intent (this authorizes the payment)
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/orders/payment-return`
    })
    
    // Update payment intent record
    await supabase
      .from('payment_intents')
      .update({
        status: confirmedIntent.status,
        payment_method_id: paymentMethodId,
        authorized_at: confirmedIntent.status === 'requires_capture' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentIntentId)
    
    // Handle different payment statuses
    if (confirmedIntent.status === 'requires_action' || confirmedIntent.status === 'requires_source_action') {
      // 3D Secure or other authentication required
      return NextResponse.json({
        status: 'requires_action',
        clientSecret: confirmedIntent.client_secret,
        nextAction: confirmedIntent.next_action
      })
    }
    
    if (confirmedIntent.status === 'requires_capture') {
      // Payment authorized successfully - this is what we want for manual capture
      
      // Create the order record
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          payment_intent_id: paymentIntentId,
          status: 'payment_authorized',
          order_data: orderState,
          total_amount: paymentRecord.amount,
          currency: 'usd',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (orderError) {
        console.error('Error creating order:', orderError)
        throw new Error('Failed to create order record')
      }
      
      // Log the authorization event
      await supabase
        .from('payment_events')
        .insert({
          payment_intent_id: paymentIntentId,
          order_id: newOrder.id,
          event_type: 'authorized',
          amount: paymentRecord.amount,
          metadata: {
            payment_method_id: paymentMethodId,
            stripe_payment_intent_id: paymentIntentId
          },
          created_at: new Date().toISOString()
        })
      
      return NextResponse.json({
        status: 'succeeded',
        orderId: newOrder.id,
        paymentIntentId,
        authorizedAmount: paymentRecord.amount
      })
    }
    
    if (confirmedIntent.status === 'succeeded') {
      // Payment was captured immediately (shouldn't happen with manual capture)
      console.warn('Payment was captured immediately despite manual capture setting')
      
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          payment_intent_id: paymentIntentId,
          status: 'payment_captured',
          order_data: orderState,
          total_amount: paymentRecord.amount,
          currency: 'usd',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (orderError) {
        console.error('Error creating order:', orderError)
        throw new Error('Failed to create order record')
      }
      
      return NextResponse.json({
        status: 'succeeded',
        orderId: newOrder.id,
        paymentIntentId,
        capturedAmount: paymentRecord.amount
      })
    }
    
    // Payment failed
    return NextResponse.json(
      { error: `Payment failed with status: ${confirmedIntent.status}` },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Payment authorization error:', error)
    
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
      { error: error instanceof Error ? error.message : 'Payment authorization failed' },
      { status: 500 }
    )
  }
})