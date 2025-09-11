/**
 * Calculate Pricing API Route
 * 
 * Calculates pricing for campaigns based on:
 * - Mail piece count and volume discounts
 * - Design services
 * - Address validation (beyond free tier)
 * - Data enrichment services
 * - User subscription plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentService } from '@/lib/payments/payment-service';
import { z } from 'zod';
import type { SubscriptionPlan } from '@/types/supabase-comprehensive';

// Request validation schema
const calculatePricingSchema = z.object({
  mailPieceCount: z.number().positive().int(),
  designServiceType: z.enum(['basic', 'custom', 'premium']).optional(),
  addressValidationCount: z.number().nonnegative().int().optional().default(0),
  dataEnrichmentServices: z.array(
    z.enum(['skipTracing', 'propertyData', 'contactData'])
  ).optional().default([]),
  includeBreakdown: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = calculatePricingSchema.parse(body);

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile for subscription plan
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Initialize payment service and calculate pricing
    const paymentService = new PaymentService();
    const pricingResult = paymentService.calculateCampaignPricing({
      mailPieceCount: validatedData.mailPieceCount,
      designServiceType: validatedData.designServiceType,
      addressValidationCount: validatedData.addressValidationCount,
      dataEnrichmentServices: validatedData.dataEnrichmentServices,
      userPlan: profile.subscription_plan as SubscriptionPlan,
    });

    // Prepare response
    const response: any = {
      success: true,
      totalCost: pricingResult.totalCost,
      totalCostCents: Math.round(pricingResult.totalCost * 100),
      discountApplied: pricingResult.discountApplied,
      userPlan: profile.subscription_plan,
    };

    if (validatedData.includeBreakdown) {
      response.breakdown = pricingResult.breakdown;
      
      // Add additional context for the breakdown
      response.context = {
        mailPieceCount: validatedData.mailPieceCount,
        baseMailPiecePrice: 0.85, // From USAGE_PRICING
        volumeDiscountApplied: pricingResult.discountApplied > 0,
        freeAddressValidations: getFreeAddressValidations(profile.subscription_plan as SubscriptionPlan),
        billableAddressValidations: Math.max(0, validatedData.addressValidationCount - getFreeAddressValidations(profile.subscription_plan as SubscriptionPlan)),
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Calculate pricing error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
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

/**
 * GET: Get pricing information and user limits
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_plan')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userPlan = profile.subscription_plan as SubscriptionPlan;

    return NextResponse.json({
      success: true,
      userPlan,
      pricing: {
        mailPieces: {
          basePrice: 0.85,
          volumeDiscounts: [
            { minQuantity: 1000, discount: 0.05 },
            { minQuantity: 5000, discount: 0.10 },
            { minQuantity: 10000, discount: 0.15 },
          ],
        },
        designServices: {
          basic: 25,
          custom: 99,
          premium: 199,
        },
        addressValidation: {
          pricePerValidation: 0.05,
          freeValidationsPerMonth: getFreeAddressValidations(userPlan),
        },
        dataEnrichment: {
          skipTracing: 0.15,
          propertyData: 0.10,
          contactData: 0.08,
        },
      },
      limits: {
        maxUsers: getMaxUsers(userPlan),
        maxCampaigns: getMaxCampaigns(userPlan),
        freeValidationsPerMonth: getFreeAddressValidations(userPlan),
      },
    });

  } catch (error) {
    console.error('Get pricing info error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getFreeAddressValidations(plan: SubscriptionPlan): number {
  const freeValidations = {
    free: 100,
    pro: 1000,
    team: 5000,
    enterprise: 20000,
  };
  return freeValidations[plan] || 0;
}

function getMaxUsers(plan: SubscriptionPlan): number {
  const maxUsers = {
    free: 1,
    pro: 1,
    team: 3,
    enterprise: 10,
  };
  return maxUsers[plan] || 1;
}

function getMaxCampaigns(plan: SubscriptionPlan): number {
  const maxCampaigns = {
    free: 5,
    pro: -1, // Unlimited
    team: -1, // Unlimited
    enterprise: -1, // Unlimited
  };
  return maxCampaigns[plan] || 5;
}