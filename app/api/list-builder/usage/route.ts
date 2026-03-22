import { NextRequest, NextResponse } from 'next/server'
import { ListBuilderService } from '@/lib/list-builder/list-builder-service'
import { withAuth } from '@/lib/auth/middleware'

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    
    const targetUserId = requestedUserId || userId

    const listBuilder = new ListBuilderService()
    const stats = await listBuilder.getUsageStats(targetUserId)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('List builder usage stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get usage statistics' },
      { status: 500 }
    )
  }
})
