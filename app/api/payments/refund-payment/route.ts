/**
 * Refund Payment API Route
 * 
 * Processes refunds for captured payments.
 * Supports both full and partial refunds.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentService, PaymentServiceError } from '@/lib/payments/payment-service';
import { z } from 'zod';

// Request validation schema
const refundPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
  refundAmount: z.number().positive().optional(), // Optional partial refund
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional().default('requested_by_customer'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = refundPaymentSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the payment intent and it's refundable
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('user_id, campaign_id, status, amount, refund_amount')
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

    if (transaction.status !== 'captured') {
      return NextResponse.json(
        { error: 'Only captured payments can be refunded' },
        { status: 400 }
      );
    }

    // Check if already fully refunded
    if (transaction.refund_amount && transaction.refund_amount >= transaction.amount) {
      return NextResponse.json(
        { error: 'Payment is already fully refunded' },
        { status: 400 }
      );
    }

    // Validate refund amount
    if (validatedData.refundAmount) {
      const maxRefundAmount = transaction.amount - (transaction.refund_amount || 0);
      if (validatedData.refundAmount > maxRefundAmount * 100) { // Convert to cents
        return NextResponse.json(
          { error: 'Refund amount exceeds available refund amount' },
          { status: 400 }
        );
      }
    }

    // Check user permissions for refunds (admin/owner only for large amounts)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const refundAmountInDollars = validatedData.refundAmount 
      ? validatedData.refundAmount / 100 
      : transaction.amount;

    if (refundAmountInDollars > 500 && !['admin', 'super_admin'].includes(profile?.role || '')) {
      return NextResponse.json(
        { error: 'Large refunds require admin approval' },
        { status: 403 }
      );
    }

    // Initialize payment service and process refund
    const paymentService = new PaymentService();
    await paymentService.refundPayment(
      validatedData.paymentIntentId,
      validatedData.refundAmount,
      validatedData.reason
    );

    // Update campaign status if needed
    if (transaction.campaign_id) {
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'cancelled' as const,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.campaign_id)
        .eq('user_id', user.id);

      if (campaignError) {
        console.error('Failed to update campaign status:', campaignError);
      }
    }

    console.log(`Payment refunded: ${validatedData.paymentIntentId} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Payment refunded successfully',
      refundAmount: validatedData.refundAmount || transaction.amount * 100,
    });

  } catch (error) {
    console.error('Refund payment error:', error);

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