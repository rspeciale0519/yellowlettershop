import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { calculatePricing } from '@/lib/orders/pricing'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { mailingOptionsSchema } from '@/lib/orders/quote-inputs'
import { getQuoteReferences, loadOrderQuote, provisionalOrderQuote, QuoteError } from '@/lib/orders/server-quote'

const PricingRequestSchema = z.union([
  z.object({ orderState: z.record(z.unknown()) }),
  z.object({ mailingOptions: mailingOptionsSchema, recordCount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) })
])

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const input = PricingRequestSchema.parse(await req.json())
    const orderState = 'orderState' in input ? input.orderState : { mailingOptions: input.mailingOptions, listData: { totalRecords: input.recordCount } }
    const db = createClient()
    const config = await loadPricingConfig(db)
    const refs = getQuoteReferences(orderState)
    if (refs.designId && refs.jobId) {
      const quote = await loadOrderQuote(db, userId, orderState, config)
      return NextResponse.json({ ...quote.result, ...quote.pricing })
    }
    const quote = provisionalOrderQuote(orderState, config)
    return NextResponse.json({ ...quote.result, ...quote.pricing })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid quote inputs', details: error.errors }, { status: 400 })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pricing calculation failed' }, { status: error instanceof QuoteError ? error.status : 400 })
  }
})

// Get pricing information and tiers (for display purposes)
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
