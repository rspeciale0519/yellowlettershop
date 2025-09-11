/**
 * Campaign Payment API Route
 * 
 * Handles payment operations for campaigns:
 * - POST: Initiate payment for campaign
 * - PUT: Confirm/capture payment
 * - DELETE: Cancel and refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { campaignPaymentService } from '@/lib/campaigns/payment-integration';
import { PaymentServiceError } from '@/lib/payments/payment-service';
import { z } from 'zod';

// Request validation schemas
const initiatePaymentSchema = z.object({
  mailPieceCount: z.number().positive().int(),
  designServiceType: z.enum(['basic', 'custom', 'premium']).optional(),
  addressValidationCount: z.number().nonnegative().int().optional().default(0),
  dataEnrichmentServices: z.array(
    z.enum(['skipTracing', 'propertyData', 'contactData'])
  ).optional().default([]),
  fulfillmentType: z.enum(['full_service', 'ship_to_user', 'print_only']),
  postageType: z.enum(['first_class_forever', 'first_class_discounted', 'standard_class']),
  designType: z.enum(['letter', 'postcard', 'envelope', 'self_mailer']),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
});

const capturePaymentSchema = z.object({
  approvedByUserId: z.string().uuid().optional(),
});

const cancelPaymentSchema = z.object({
  reason: z.string().min(1).max(500),
  refundAmount: z.number().positive().optional(),
});

/**
 * POST: Initiate payment for campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = initiatePaymentSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, user_id, status')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      );
    }

    // Check campaign status
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Campaign must be in draft status to initiate payment' },
        { status: 400 }
      );
    }

    // Initiate payment
    const result = await campaignPaymentService.initiateCampaignPayment({
      campaignId,
      userId: user.id,
      ...validatedData,
    });

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: result.paymentIntent.id,
        clientSecret: result.paymentIntent.clientSecret,
        amount: result.paymentIntent.amount,
      },
      pricing: result.pricing,
      campaignOrder: result.campaignOrder,
    });

  } catch (error) {
    console.error('Campaign payment initiation error:', error);

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
 * PUT: Confirm or capture payment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    const body = await request.json();
    const action = body.action; // 'confirm' or 'capture'

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (action === 'confirm') {
      // Confirm payment authorization
      const validatedData = confirmPaymentSchema.parse(body);
      
      await campaignPaymentService.confirmCampaignPayment({
        campaignId,
        userId: user.id,
        paymentIntentId: validatedData.paymentIntentId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed successfully',
        status: 'paid',
      });

    } else if (action === 'capture') {
      // Capture authorized payment
      const validatedData = capturePaymentSchema.parse(body);

      await campaignPaymentService.captureCampaignPayment({
        campaignId,
        userId: user.id,
        approvedByUserId: validatedData.approvedByUserId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment captured successfully',
        status: 'in_production',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "confirm" or "capture"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Campaign payment update error:', error);

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
 * DELETE: Cancel campaign and refund payment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    
    // Parse request body for cancellation details
    const body = await request.json();
    const validatedData = cancelPaymentSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cancel campaign and process refund
    await campaignPaymentService.cancelCampaignAndRefund({
      campaignId,
      userId: user.id,
      reason: validatedData.reason,
      refundAmount: validatedData.refundAmount,
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign cancelled and refund processed',
      status: 'cancelled',
    });

  } catch (error) {
    console.error('Campaign cancellation error:', error);

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
 * GET: Get campaign payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get campaign and payment details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, status, created_at, updated_at')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      );
    }

    // Get payment transaction details
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('stripe_payment_intent_id, amount, status, authorized_at, captured_at')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        status: campaign.status,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
      },
      paymentTransactions: transactions || [],
    });

  } catch (error) {
    console.error('Get campaign payment status error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}