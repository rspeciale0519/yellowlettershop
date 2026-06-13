import { NextRequest, NextResponse } from 'next/server'
import { TeamService, InviteTeamMemberRequest } from '@/lib/team/team-service'
import { withAuth, authorizeTeamAccess } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { trySendEmail } from '@/lib/email'
import { teamInviteEmail } from '@/lib/email/templates'

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

    const teamService = new TeamService()
    const invitation = await teamService.inviteTeamMember(teamId, inviteData)

    // The actual invitation email — team-service's client-side stub cannot
    // send; this server route owns delivery. Loud-on-failure, non-fatal.
    const supabase = createClient()
    const { data: team } = await supabase.from('teams').select('name').eq('id', teamId).single()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailSent = await trySendEmail(
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
      { error: error instanceof Error ? error.message : 'Failed to invite team member' },
      { status: 500 }
    )
  }
})
