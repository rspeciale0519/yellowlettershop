/**
 * Test Pricing Calculation API Route
 * 
 * Tests the pricing calculation functionality without authentication.
 * Only available in development environment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payments/payment-service';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const paymentService = new PaymentService();
    
    // Test different pricing scenarios
    const testCases = [
      {
        name: 'Small Campaign (Pro User)',
        params: {
          mailPieceCount: 100,
          designServiceType: 'basic' as const,
          addressValidationCount: 50,
          dataEnrichmentServices: [] as const,
          userPlan: 'pro' as const,
        },
      },
      {
        name: 'Medium Campaign with Volume Discount',
        params: {
          mailPieceCount: 1500,
          designServiceType: 'custom' as const,
          addressValidationCount: 200,
          dataEnrichmentServices: ['skipTracing'] as const,
          userPlan: 'team' as const,
        },
      },
      {
        name: 'Large Enterprise Campaign',
        params: {
          mailPieceCount: 10000,
          designServiceType: 'premium' as const,
          addressValidationCount: 5000,
          dataEnrichmentServices: ['skipTracing', 'propertyData'] as const,
          userPlan: 'enterprise' as const,
        },
      },
    ];

    const results = testCases.map(testCase => {
      const pricing = paymentService.calculateCampaignPricing(testCase.params);
      return {
        testCase: testCase.name,
        input: testCase.params,
        result: pricing,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: results,
      environment: process.env.NODE_ENV,
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    });

  } catch (error) {
    console.error('Pricing test error:', error);
    return NextResponse.json(
      { 
        error: 'Test execution failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      mailPieceCount = 1000,
      designServiceType = 'basic',
      addressValidationCount = 0,
      dataEnrichmentServices = [],
      userPlan = 'pro',
    } = body;

    const paymentService = new PaymentService();
    const pricing = paymentService.calculateCampaignPricing({
      mailPieceCount,
      designServiceType,
      addressValidationCount,
      dataEnrichmentServices,
      userPlan,
    });

    return NextResponse.json({
      success: true,
      input: {
        mailPieceCount,
        designServiceType,
        addressValidationCount,
        dataEnrichmentServices,
        userPlan,
      },
      result: pricing,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Custom pricing test error:', error);
    return NextResponse.json(
      { 
        error: 'Test execution failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}