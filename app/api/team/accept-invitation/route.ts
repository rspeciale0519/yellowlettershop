import { NextRequest, NextResponse } from 'next/server'
import { TeamService } from '@/lib/team/team-service'
import { withAuth } from '@/lib/auth/middleware'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const teamService = new TeamService()
    const member = await teamService.acceptInvitation(invitationId, userId)

    return NextResponse.json(member)

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    )
  }
})
