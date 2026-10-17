import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { getQuoteReferences, loadOrderQuote, provisionalOrderQuote, QuoteError } from '@/lib/orders/server-quote'

const schema = z.object({ orderState: z.record(z.unknown()) })
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const { orderState } = schema.parse(await req.json())
    const db = createClient()
    const config = await loadPricingConfig(db)
    const refs = getQuoteReferences(orderState)
    const quote = refs.designId && refs.jobId
      ? await loadOrderQuote(db, userId, orderState, config)
      : provisionalOrderQuote(orderState, config)
    return NextResponse.json(quote.pricing)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid quote inputs', details: error.errors }, { status: 400 })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Pricing calculation failed' }, { status: error instanceof QuoteError ? error.status : 400 })
  }
})
