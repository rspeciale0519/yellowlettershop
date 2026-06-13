import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { generateProofForOrder, getUserEmail } from '@/lib/orders/generate-proof'
import { summarizeOrderRow } from '@/lib/orders/order-summary'
import { trySendEmail } from '@/lib/email'
import { orderConfirmationEmail } from '@/lib/email/templates'

const SubmitOrderSchema = z.object({
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { orderState } = SubmitOrderSchema.parse(body)

    const payment = (orderState as Record<string, unknown>).payment as
      | { status?: string; paymentIntentId?: string }
      | undefined

    if (payment?.status !== 'authorized') {
      return NextResponse.json(
        { error: 'Payment must be authorized before submitting' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const draftId = typeof (orderState as Record<string, unknown>).orderId === 'string'
      ? (orderState as Record<string, unknown>).orderId as string
      : null

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_state: orderState,
        draft_id: draftId,
        payment_intent_id: payment?.paymentIntentId ?? null,
        status_history: [{ status: 'submitted', at: new Date().toISOString() }]
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    if (draftId) {
      await supabase
        .from('order_drafts')
        .update({ status: 'submitted' })
        .eq('id', draftId)
        .eq('user_id', userId)
    }

    // Confirmation email + official proof. Both are loud-on-failure but
    // non-fatal: the order exists and payment is authorized either way.
    const summary = summarizeOrderRow({
      id: order.id,
      status: 'submitted',
      order_state: orderState,
    })
    const email = await getUserEmail(userId)
    await trySendEmail(
      email,
      orderConfirmationEmail({
        orderId: order.id,
        shortId: order.id.split('-')[0].toUpperCase(),
        total: summary.total,
        recordCount: summary.recordCount,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      })
    )

    const proof = await generateProofForOrder(order.id, userId)
    if (!proof.ok) {
      console.error(`Proof generation deferred for order ${order.id}: ${proof.error}`)
    }

    return NextResponse.json({
      orderId: order.id,
      status: proof.ok ? 'proof_ready' : 'submitted',
      proofUrl: proof.proofUrl ?? null
    })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Submit order error:', err)
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
})
