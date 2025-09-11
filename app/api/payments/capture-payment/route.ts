/**
 * Capture Payment API Route
 * 
 * Captures a previously authorized payment intent.
 * This is called after order approval to actually charge the customer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentService, PaymentServiceError } from '@/lib/payments/payment-service';
import { z } from 'zod';

// Request validation schema
const capturePaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  captureAmount: z.number().positive().optional(), // Optional partial capture
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = capturePaymentSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the payment intent
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('user_id, campaign_id, status, amount')
      .eq('stripe_payment_intent_id', validatedData.paymentIntentId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Payment transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - payment belongs to different user' },
        { status: 403 }
      );
    }

    if (transaction.status !== 'authorized' && transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment cannot be captured in current status' },
        { status: 400 }
      );
    }

    // Validate capture amount if provided
    if (validatedData.captureAmount) {
      const maxCaptureAmount = Math.round(transaction.amount * 100); // Convert to cents
      if (validatedData.captureAmount > maxCaptureAmount) {
        return NextResponse.json(
          { error: 'Capture amount exceeds authorized amount' },
          { status: 400 }
        );
      }
    }

    // Initialize payment service and capture payment
    const paymentService = new PaymentService();
    await paymentService.capturePayment(
      validatedData.paymentIntentId,
      validatedData.captureAmount
    );

    // If this is for a campaign, update campaign status
    if (transaction.campaign_id) {
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'paid' as const,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.campaign_id)
        .eq('user_id', user.id); // Ensure user owns the campaign

      if (campaignError) {
        console.error('Failed to update campaign status:', campaignError);
      }
    }

    console.log(`Payment captured: ${validatedData.paymentIntentId} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Payment captured successfully',
      capturedAmount: validatedData.captureAmount || transaction.amount * 100,
    });

  } catch (error) {
    console.error('Capture payment error:', error);

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