/**
 * Attach Payment Method API Route
 * 
 * Attaches a payment method to a customer account.
 * Used when adding new payment methods through the setup flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentService, PaymentServiceError } from '@/lib/payments/payment-service';
import { stripe } from '@/lib/payments/stripe-config';
import { z } from 'zod';

// Request validation schema
const attachPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  setAsDefault: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = attachPaymentMethodSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create customer
    const paymentService = new PaymentService();
    const customerId = await paymentService.ensureCustomer(user.id);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(validatedData.paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested
    if (validatedData.setAsDefault) {
      await paymentService.setDefaultPaymentMethod(user.id, validatedData.paymentMethodId);
    }

    // Log the payment method addition
    const { error: analyticsError } = await supabase
      .from('user_analytics')
      .insert({
        user_id: user.id,
        event_type: 'payment_method_added',
        metadata: {
          payment_method_id: validatedData.paymentMethodId,
          customer_id: customerId,
          set_as_default: validatedData.setAsDefault,
        },
      });

    if (analyticsError) {
      console.error('Failed to log payment method addition:', analyticsError);
    }

    console.log(`Payment method attached: ${validatedData.paymentMethodId} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethodId: validatedData.paymentMethodId,
      isDefault: validatedData.setAsDefault,
    });

  } catch (error) {
    console.error('Attach payment method error:', error);

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

    // Handle Stripe errors specifically
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      return NextResponse.json(
        { 
          error: stripeError.message || 'Payment method attachment failed',
          code: stripeError.code,
        },
        { status: 400 }
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