import { NextRequest, NextResponse } from 'next/server'
import { TeamService, InviteTeamMemberRequest } from '@/lib/team/team-service'
import { withAuth, authorizeTeamAccess } from '@/lib/auth/middleware'

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

    return NextResponse.json(invitation)

  } catch (error) {
    console.error('Team invitation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite team member' },
      { status: 500 }
    )
  }
})
