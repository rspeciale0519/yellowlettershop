import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { summarizeOrderRow } from '@/lib/orders/order-summary'

/** List the authenticated user's orders, newest first. */
export const GET = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, submitted_at, created_at, proof_urls, proof_approved_at, payment_status, amount_authorized, amount_captured, total_cost, record_count, mail_class, postage_type')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ orders: (data ?? []).map(summarizeOrderRow) })
  } catch (err) {
    console.error('List orders error:', err)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
})
