import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { calculatePricing } from '@/lib/orders/pricing'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { loadTrustedCheckout } from '@/lib/orders/trusted-checkout'

const PricingRequestSchema = z.object({
  mailingOptions: z.object({
    serviceLevel: z.enum(['full_service', 'ship_processed', 'print_only']),
    mailPieceFormat: z.string().optional(),
    paperStock: z.string().optional(),
    finish: z.string().optional(),
    postageType: z.string().optional(),
    includePostage: z.boolean().optional()
  }),
  validationJobId: z.string().uuid(),
  // Ignored — count comes from the owned, finished validation job.
  recordCount: z.number().optional()
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { mailingOptions, validationJobId } = PricingRequestSchema.parse(body)
    const supabase = createClient()
    const config = await loadPricingConfig(supabase)
    const priced = await loadTrustedCheckout(
      supabase,
      userId,
      { mailingOptions, accuzipValidation: { jobId: validationJobId } },
      config
    )
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status })
    }
    return NextResponse.json(calculatePricing(priced.mailingOptions, priced.recordCount, config))
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

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const recordCount = parseInt(url.searchParams.get('recordCount') || '100')
    const config = await loadPricingConfig(createClient())

    const examples = {
      postcard_4x6_500: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
        500,
        config
      ),
      postcard_5x7_1000: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_5x7' },
        1000,
        config
      ),
      letter_2500: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11' },
        2500,
        config
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
