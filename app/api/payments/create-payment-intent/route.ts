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
import { createServiceClient } from '@/utils/supabase/service';
import { loadPricingConfig } from '@/lib/orders/pricing-config';
import { loadOrderQuote, QuoteError } from '@/lib/orders/server-quote';

// Request validation schema
const createPaymentIntentSchema = z.object({
  orderState: z.record(z.unknown()),
  automaticPaymentMethods: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPaymentIntentSchema.parse(body);

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = createServiceClient();
    const quote = await loadOrderQuote(service, user.id, validatedData.orderState, await loadPricingConfig(service));

    // Initialize payment service
    const paymentService = new PaymentService();

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      userId: user.id,
      amount: quote.amountCents,
      currency: 'usd',
      description: `Direct Mail Order - ${quote.result.recordCount} records`,
      metadata: {
        user_id: user.id,
        order_type: 'direct_mail',
        record_count: String(quote.result.recordCount),
        quote_revision: quote.pricing.quoteRevision,
        design_revision: quote.pricing.designRevision,
      },
      automaticPaymentMethods: validatedData.automaticPaymentMethods,
    });

    // Log the payment intent creation
    console.log(`Payment intent created: ${paymentIntent.id} for user ${user.id}`);

    return NextResponse.json({
      success: true,
      pricing: quote.pricing,
      quoteRevision: quote.pricing.quoteRevision,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      },
    });

  } catch (error) {
    if (error instanceof QuoteError) return NextResponse.json({ error: error.message }, { status: error.status });
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
