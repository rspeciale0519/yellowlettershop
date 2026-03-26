import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

export const GET = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 1]

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('order_drafts')
      .select('id, order_state, expires_at')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Draft expired' }, { status: 404 })
    }

    return NextResponse.json({ orderState: data.order_state })

  } catch (err) {
    console.error('Load draft error:', err)
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
  }
})
