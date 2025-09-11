/**
 * Create Payment Intent API Route
 * 
 * Creates a Stripe payment intent for order authorization.
 * This follows the manual capture workflow - payments are authorized but not captured
 * until the order is approved and ready for fulfillment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentService, PaymentServiceError } from '@/lib/payments/payment-service';
import { z } from 'zod';

// Request validation schema
const createPaymentIntentSchema = z.object({
  amount: z.number().positive().min(50), // Minimum $0.50 in cents
  currency: z.string().optional().default('usd'),
  description: z.string().min(1).max(500),
  campaignId: z.string().uuid().optional(),
  metadata: z.record(z.string()).optional().default({}),
  automaticPaymentMethods: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPaymentIntentSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has an active subscription for paid plans
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_plan, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Initialize payment service
    const paymentService = new PaymentService();

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      userId: user.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      description: validatedData.description,
      campaignId: validatedData.campaignId,
      metadata: {
        ...validatedData.metadata,
        userPlan: profile.subscription_plan,
        userEmail: user.email || '',
      },
      automaticPaymentMethods: validatedData.automaticPaymentMethods,
    });

    // Log the payment intent creation
    console.log(`Payment intent created: ${paymentIntent.id} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      },
    });

  } catch (error) {
    console.error('Create payment intent error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof PaymentServiceError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}