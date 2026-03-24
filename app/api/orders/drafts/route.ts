import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const SaveDraftSchema = z.object({
  orderId:    z.string().uuid().optional(),
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { orderId, orderState } = SaveDraftSchema.parse(body)
    const supabase = createClient()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (orderId) {
      const { data: existing } = await supabase
        .from('order_drafts')
        .select('id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from('order_drafts')
        .update({
          order_state: orderState,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      return NextResponse.json({ orderId })
    }

    const { data, error } = await supabase
      .from('order_drafts')
      .insert({ user_id: userId, order_state: orderState, expires_at: expiresAt })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ orderId: data.id })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Save draft error:', err)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
})
