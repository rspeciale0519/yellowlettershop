import { NextRequest, NextResponse } from 'next/server'
import { TeamService } from '@/lib/team/team-service'

export async function POST(request: NextRequest) {
  try {
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    const teamService = new TeamService()
    const member = await teamService.acceptInvitation(invitationId)

    return NextResponse.json(member)

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
