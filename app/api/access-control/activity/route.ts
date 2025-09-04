import { timeBasedPermissions } from '@/lib/access-control/time-based-permissions'
import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    const activities = await timeBasedPermissions.getTeamActivityLog(teamId, limit, offset)
    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching team activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team activity' },
      { status: 500 }
    )
  }
}
