import { NextRequest, NextResponse } from 'next/server'
import { TeamService, CreateTeamRequest } from '@/lib/team/team-service'
import { withAuth } from '@/lib/auth/middleware'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const requestData: CreateTeamRequest = await request.json()

    if (!requestData.name || !requestData.plan) {
      return NextResponse.json(
        { error: 'Team name and plan are required' },
        { status: 400 }
      )
    }

    const teamService = new TeamService()
    const team = await teamService.createTeam({ ...requestData, ownerId: userId })

    return NextResponse.json(team)

  } catch (error) {
    console.error('Team creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create team' },
      { status: 500 }
    )
  }
})
