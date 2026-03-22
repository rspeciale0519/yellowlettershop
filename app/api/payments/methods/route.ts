import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

// Get user's payment methods
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const supabase = createClient()
    
    // Get user's Stripe customer ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()
    
    if (!userProfile?.stripe_customer_id) {
      // No Stripe customer yet, return empty array
      return NextResponse.json([])
    }
    
    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userProfile.stripe_customer_id,
      type: 'card'
    })
    
    // Transform to our format
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month || 0,
      expYear: pm.card?.exp_year || 0,
      isDefault: false // We'll handle default logic separately if needed
    }))
    
    return NextResponse.json(formattedMethods)
    
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
})

// Add a new payment method
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { paymentMethodId, setAsDefault } = body
    
    const supabase = createClient()
    
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
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    })
    
    // Set as default payment method if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      })
    }
    
    // Get the updated payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    const formattedMethod = {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand || 'unknown',
      last4: paymentMethod.card?.last4 || '****',
      expMonth: paymentMethod.card?.exp_month || 0,
      expYear: paymentMethod.card?.exp_year || 0,
      isDefault: setAsDefault
    }
    
    return NextResponse.json(formattedMethod)
    
  } catch (error) {
    console.error('Error adding payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    )
  }
})

// Delete a payment method
export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const url = new URL(req.url)
    const paymentMethodId = url.searchParams.get('id')
    
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Verify the payment method belongs to the user's customer
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()
    
    if (!userProfile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No payment methods found' },
        { status: 404 }
      )
    }
    
    // Get payment method to verify ownership
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    if (paymentMethod.customer !== userProfile.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }
    
    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error deleting payment method:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
})