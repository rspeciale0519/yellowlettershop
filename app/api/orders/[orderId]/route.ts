import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { summarizeOrderRow } from '@/lib/orders/order-summary'
import { signProofUrl } from '@/lib/orders/proof-storage'

/** Fetch a single order (owner-scoped) for the status/success pages. */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const orderId = req.nextUrl.pathname.split('/').pop()
    if (!orderId) {
      return NextResponse.json({ error: 'Order id required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, submitted_at, created_at, proof_urls, proof_approved_at, payment_status, amount_authorized, amount_captured, total_cost, record_count, mail_class, postage_type')
      .eq('id', orderId)
      .eq('created_by', userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Tracking lives on the vendor dispatch, not the order. Read-only here:
    // the customer sees carrier + number once the vendor reports shipment.
    const { data: dispatch } = await supabase
      .from('order_dispatches')
      .select('tracking_number, tracking_carrier')
      .eq('order_id', orderId)
      .order('dispatched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const order = summarizeOrderRow(data, dispatch ?? undefined)
    order.proofUrl = await signProofUrl(supabase, order.proofUrl)
    return NextResponse.json({ order })
  } catch (err) {
    console.error('Get order error:', err)
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
})
