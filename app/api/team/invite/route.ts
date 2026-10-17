import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { InviteTeamMemberRequest } from '@/lib/team/team-service'
import { withAuth, authorizeTeamAccess } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { createServerClient } from '@/utils/supabase/server'
import { trySendEmail } from '@/lib/email'
import { teamInviteEmail } from '@/lib/email/templates'
import { rpcInviteMember, type TeamWriteClient } from '@/lib/team/team-write-rpc'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { teamId, ...inviteData }: { teamId: string } & InviteTeamMemberRequest = await request.json()

    if (!teamId || !inviteData.email || !inviteData.role) {
      return NextResponse.json(
        { error: 'Team ID, email, and role are required' },
        { status: 400 }
      )
    }

    const hasAccess = await authorizeTeamAccess(userId, teamId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized access to team' },
        { status: 403 }
      )
    }

    const session = await createServerClient()
    const result = await rpcInviteMember(
      session as unknown as TeamWriteClient,
      teamId,
      inviteData.email,
      inviteData.role,
      uuidv4()
    )
    const { data: stored } = await session
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', inviteData.email)
      .maybeSingle()
    const invitation = stored ?? {
      id: result.token,
      team_id: teamId,
      email: inviteData.email,
      role: inviteData.role,
      status: result.mode === 'added' ? 'accepted' : 'pending',
    }

    const supabase = createClient()
    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailSent = result.mode === 'invited' && await trySendEmail(
      inviteData.email,
      teamInviteEmail({
        teamName: team?.name ?? 'your team',
        role: inviteData.role,
        inviteUrl: `${appUrl}/dashboard/team-management?invitation=${invitation.id}`,
      })
    )

    return NextResponse.json({ ...invitation, emailSent })
  } catch (error) {
    console.error('Team invitation error:', error)
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    )
  }
})
