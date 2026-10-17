import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createServerClient } from '@/utils/supabase/server'
import { rpcCreateTeam, type TeamWriteClient } from '@/lib/team/team-write-rpc'

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const requestData = await request.json() as { name?: string; plan?: string }
    if (!requestData.name || !requestData.plan) {
      return NextResponse.json(
        { error: 'Team name and plan are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    const teamId = await rpcCreateTeam(supabase as unknown as TeamWriteClient, requestData.name)
    const { data: team, error } = await supabase.from('teams').select().eq('id', teamId).single()
    if (error || !team) {
      return NextResponse.json({ error: 'Team was created but could not be loaded' }, { status: 500 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Team creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create team' },
      { status: 500 }
    )
  }
})
