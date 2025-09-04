import { timeBasedPermissions } from '@/lib/access-control/time-based-permissions'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { target_user_id } = body
    const templateId = params.id

    if (!target_user_id) {
      return NextResponse.json(
        { error: 'Missing target_user_id' },
        { status: 400 }
      )
    }

    await timeBasedPermissions.applyPermissionTemplate(
      templateId,
      target_user_id,
      user.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error applying permission template:', error)
    return NextResponse.json(
      { error: 'Failed to apply permission template' },
      { status: 500 }
    )
  }
}
