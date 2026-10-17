import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { calculatePricing } from '@/lib/orders/pricing'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { toPricingBreakdown } from '@/lib/orders/pricing-breakdown'
import { loadTrustedCheckout } from '@/lib/orders/trusted-checkout'

const PricingFromStateSchema = z.object({
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { orderState } = PricingFromStateSchema.parse(body)
    const supabase = createClient()
    const config = await loadPricingConfig(supabase)
    const priced = await loadTrustedCheckout(supabase, userId, orderState, config)
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status })
    }

    return NextResponse.json(toPricingBreakdown(calculatePricing(priced.mailingOptions, priced.recordCount, config)))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Pricing error:', err)
    return NextResponse.json({ error: 'Pricing calculation failed' }, { status: 500 })
  }
})
