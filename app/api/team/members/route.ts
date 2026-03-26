import { NextRequest, NextResponse } from 'next/server'
import { TeamService } from '@/lib/team/team-service'
import { withAuth, authorizeTeamAccess } from '@/lib/auth/middleware'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
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
    const members = await teamService.getTeamMembers(teamId)

    return NextResponse.json(members)

  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get team members' },
      { status: 500 }
    )
  }
})

export const PATCH = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { teamId, memberId, permissions, role } = await request.json()

    if (!teamId || !memberId || !permissions) {
      return NextResponse.json(
        { error: 'Team ID, member ID, and permissions are required' },
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
    await teamService.updateMemberPermissions(teamId, memberId, permissions, role)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update member permissions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member permissions' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { teamId, memberId } = await request.json()

    if (!teamId || !memberId) {
      return NextResponse.json(
        { error: 'Team ID and member ID are required' },
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
    await teamService.removeMember(teamId, memberId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove team member' },
      { status: 500 }
    )
  }
})
