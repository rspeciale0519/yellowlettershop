import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { PaymentIntentService } from '@/lib/payments/payment-intent-service'
import { trySendEmail } from '@/lib/email'
import { paymentCapturedEmail } from '@/lib/email/templates'
import { summarizeOrderRow } from '@/lib/orders/order-summary'
import { getUserEmail } from '@/lib/orders/generate-proof'

const ApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

type HistoryEntry = { status: string; at: string; note?: string }

/**
 * Customer verdict on the proof. Approve captures the authorized payment and
 * moves the order to processing; reject parks it for follow-up. This is THE
 * moment money moves — capture failures are surfaced, never absorbed.
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const orderId = req.nextUrl.pathname.split('/').slice(-2)[0]
    const { action } = ApprovalSchema.parse(await req.json())

    const supabase = createClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id, status, payment_intent_id, status_history, order_state')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status !== 'proof_ready') {
      return NextResponse.json(
        { error: `Order is "${order.status}" — only proof_ready orders can be approved or rejected` },
        { status: 409 }
      )
    }

    const history: HistoryEntry[] = Array.isArray(order.status_history) ? order.status_history : []
    const now = new Date().toISOString()

    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'rejected',
          updated_at: now,
          status_history: [...history, { status: 'rejected', at: now }],
        })
        .eq('id', orderId)
        .eq('user_id', userId)
      if (updateError) throw updateError
      return NextResponse.json({ status: 'rejected' })
    }

    if (!order.payment_intent_id) {
      return NextResponse.json(
        { error: 'Order has no payment authorization on file — contact support' },
        { status: 409 }
      )
    }

    // Record the approval before money moves so an interrupted capture is
    // visible as approved-but-uncaptured, not lost.
    const approvedHistory = [...history, { status: 'approved', at: now }]
    const { error: approveError } = await supabase
      .from('orders')
      .update({ status: 'approved', approved_at: now, updated_at: now, status_history: approvedHistory })
      .eq('id', orderId)
      .eq('user_id', userId)
    if (approveError) throw approveError

    try {
      const service = new PaymentIntentService()
      await service.capturePayment({ paymentIntentId: order.payment_intent_id })
    } catch (captureError) {
      console.error(`Payment capture failed for order ${orderId}:`, captureError)
      await supabase
        .from('orders')
        .update({
          status_history: [
            ...approvedHistory,
            { status: 'approved', at: new Date().toISOString(), note: 'capture_failed' },
          ],
        })
        .eq('id', orderId)
      return NextResponse.json(
        { error: 'Your approval was recorded but the payment capture failed. Our team has been notified — no further action needed from you.' },
        { status: 502 }
      )
    }

    const capturedAt = new Date().toISOString()
    const { error: capturedError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        captured_at: capturedAt,
        updated_at: capturedAt,
        status_history: [...approvedHistory, { status: 'processing', at: capturedAt }],
      })
      .eq('id', orderId)
      .eq('user_id', userId)
    if (capturedError) throw capturedError

    const summary = summarizeOrderRow(order)
    const email = await getUserEmail(userId)
    await trySendEmail(
      email,
      paymentCapturedEmail({
        orderId,
        shortId: orderId.split('-')[0].toUpperCase(),
        total: summary.total,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      })
    )

    return NextResponse.json({ status: 'processing', capturedAt })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Order approval error:', err)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
})
