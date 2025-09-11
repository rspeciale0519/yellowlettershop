import { timeBasedPermissions } from '@/lib/access-control/time-based-permissions'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, review_notes } = body
    const requestId = params.id

    if (!action || !['approve', 'deny', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, deny, or withdraw' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      await timeBasedPermissions.approveAccessRequest(
        requestId,
        user.id,
        review_notes
      )
    } else if (action === 'deny') {
      await timeBasedPermissions.denyAccessRequest(
        requestId,
        user.id,
        review_notes
      )
    } else if (action === 'withdraw') {
      // User withdrawing their own request
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('requester_id', user.id) // Can only withdraw own requests

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating access request:', error)
    return NextResponse.json(
      { error: 'Failed to update access request' },
      { status: 500 }
    )
  }
}
