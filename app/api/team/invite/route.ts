import { NextRequest, NextResponse } from 'next/server'
import { TeamService, InviteTeamMemberRequest } from '@/lib/team/team-service'

export async function POST(request: NextRequest) {
  try {
    const { teamId, ...inviteData }: { teamId: string } & InviteTeamMemberRequest = await request.json()

    if (!teamId || !inviteData.email || !inviteData.role) {
      return NextResponse.json(
        { error: 'Team ID, email, and role are required' },
        { status: 400 }
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
}
