import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { generateProofForOrder, getUserEmail } from '@/lib/orders/generate-proof'
import { summarizeOrderRow } from '@/lib/orders/order-summary'
import { verifyAuthorizedPayment } from '@/lib/orders/verify-payment'
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
      | { paymentIntentId?: string }
      | undefined

    const paymentIntentId = payment?.paymentIntentId
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment must be authorized before submitting' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // SECURITY: never trust the client's payment status/id. Look the intent up
    // server-side scoped to this user (ownership), and verify it is authorized
    // and its amount matches this order's server-computed total. Prevents
    // submitting an order against someone else's or an underpriced intent.
    const { data: storedIntent } = await supabase
      .from('payment_intents')
      .select('amount, status')
      .eq('id', paymentIntentId)
      .eq('user_id', userId)
      .single()

    const orderTotal = summarizeOrderRow({ id: 'pending', status: 'pending', order_state: orderState }).total
    const verdict = verifyAuthorizedPayment(storedIntent ?? null, orderTotal)
    if (!verdict.ok) {
      console.error(`Order submit payment verification failed for user ${userId}: ${verdict.reason}`)
      return NextResponse.json(
        { error: 'Payment could not be verified for this order. Please restart checkout.' },
        { status: 402 }
      )
    }

    const draftId = typeof (orderState as Record<string, unknown>).orderId === 'string'
      ? (orderState as Record<string, unknown>).orderId as string
      : null

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_state: orderState,
        draft_id: draftId,
        payment_intent_id: paymentIntentId,
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
