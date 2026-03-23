import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { calculatePricing } from '@/lib/orders/pricing'

const PricingRequestSchema = z.object({
  mailingOptions: z.object({
    serviceLevel: z.enum(['full_service', 'ship_processed', 'print_only']),
    mailPieceFormat: z.enum(['postcard_4x6', 'postcard_5x7', 'letter_8_5x11', 'letter_folded']).optional(),
    paperStock: z.enum(['standard_14pt', 'premium_16pt', 'luxury_18pt']).optional(),
    finish: z.enum(['matte', 'gloss', 'uv_coating']).optional(),
    postageType: z.enum(['first_class_forever', 'first_class_discounted', 'standard']).optional(),
    includePostage: z.boolean().optional()
  }),
  recordCount: z.number().min(1)
})

export const POST = withAuth(async (req: NextRequest, { userId: _userId }) => {
  try {
    const body = await req.json()
    const { mailingOptions, recordCount } = PricingRequestSchema.parse(body)
    const result = calculatePricing(mailingOptions, recordCount)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pricing calculation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Pricing calculation failed' },
      { status: 500 }
    )
  }
})

// Get pricing information and tiers (for display purposes)
export const GET = withAuth(async (req: NextRequest, { userId: _userId }) => {
  try {
    const url = new URL(req.url)
    const recordCount = parseInt(url.searchParams.get('recordCount') || '100')

    const examples = {
      postcard_4x6_500: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
        500
      ),
      postcard_5x7_1000: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_5x7' },
        1000
      ),
      letter_2500: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11' },
        2500
      )
    }

    return NextResponse.json({ recordCount, examples })
  } catch (error) {
    console.error('Pricing info error:', error)
    return NextResponse.json(
      { error: 'Failed to get pricing information' },
      { status: 500 }
    )
  }
})
