import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { summarizeOrderRow } from '@/lib/orders/order-summary'

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

    return NextResponse.json({ order: summarizeOrderRow(data) })
  } catch (err) {
    console.error('Get order error:', err)
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 })
  }
})
