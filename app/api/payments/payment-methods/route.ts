/**
 * Payment Methods API Route
 * 
 * Manages customer payment methods:
 * - GET: List customer payment methods
 * - POST: Set default payment method
 * - DELETE: Remove payment method
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentService, PaymentServiceError } from '@/lib/payments/payment-service';
import { z } from 'zod';

// Request validation schemas
const setDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

const deletePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
});

/**
 * GET: Retrieve customer payment methods
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize payment service
    const paymentService = new PaymentService();
    
    // Get payment methods
    const paymentMethods = await paymentService.getPaymentMethods(user.id);

    return NextResponse.json({
      success: true,
      paymentMethods,
    });

  } catch (error) {
    console.error('Get payment methods error:', error);

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

/**
 * POST: Set default payment method
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = setDefaultPaymentMethodSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize payment service
    const paymentService = new PaymentService();
    
    // Set default payment method
    await paymentService.setDefaultPaymentMethod(user.id, validatedData.paymentMethodId);

    console.log(`Default payment method set: ${validatedData.paymentMethodId} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully',
    });

  } catch (error) {
    console.error('Set default payment method error:', error);

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

/**
 * DELETE: Remove payment method
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse query parameters or body
    const url = new URL(request.url);
    const paymentMethodId = url.searchParams.get('paymentMethodId');
    
    if (!paymentMethodId) {
      const body = await request.json();
      const validatedData = deletePaymentMethodSchema.parse(body);
      
      return await deletePaymentMethodHandler(validatedData.paymentMethodId);
    }

    return await deletePaymentMethodHandler(paymentMethodId);

  } catch (error) {
    console.error('Delete payment method error:', error);

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

async function deletePaymentMethodHandler(paymentMethodId: string) {
  // Get authenticated user
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify user owns the payment method by checking if it's in their list
  const paymentService = new PaymentService();
  const paymentMethods = await paymentService.getPaymentMethods(user.id);
  
  const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  if (!paymentMethod) {
    return NextResponse.json(
      { error: 'Payment method not found or not owned by user' },
      { status: 404 }
    );
  }

  // Check if this is the default payment method
  if (paymentMethod.isDefault && paymentMethods.length > 1) {
    return NextResponse.json(
      { error: 'Cannot delete default payment method. Set another as default first.' },
      { status: 400 }
    );
  }

  // Delete payment method
  await paymentService.deletePaymentMethod(paymentMethodId);

  console.log(`Payment method deleted: ${paymentMethodId} for user ${user.id}`);

  return NextResponse.json({
    success: true,
    message: 'Payment method deleted successfully',
  });
}