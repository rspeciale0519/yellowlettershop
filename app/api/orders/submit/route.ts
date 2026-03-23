import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const SubmitOrderSchema = z.object({
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { orderState } = SubmitOrderSchema.parse(body)

    const payment = (orderState as Record<string, unknown>).payment as
      | { status?: string }
      | undefined

    if (payment?.status !== 'authorized') {
      return NextResponse.json(
        { error: 'Payment must be authorized before submitting' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: userId, order_state: orderState })
      .select('id')
      .single()

    if (orderError) throw orderError

    const draftId = (orderState as Record<string, unknown>).orderId
    if (typeof draftId === 'string') {
      await supabase
        .from('order_drafts')
        .update({ status: 'submitted' })
        .eq('id', draftId)
        .eq('user_id', userId)
    }

    return NextResponse.json({ orderId: order.id, status: 'submitted' })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Submit order error:', err)
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
})
