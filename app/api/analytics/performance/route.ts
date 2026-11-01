import { NextRequest, NextResponse } from 'next/server'
import { EngagementTracker } from '@/lib/analytics/engagement-tracker'
import { withProtectedRoute } from '@/lib/auth/with-protected-route'

export const GET = withProtectedRoute(async (_request: NextRequest, { userId }) => {
  try {
    const tracker = new EngagementTracker()
    const metrics = await tracker.getUserPerformanceMetrics(userId)

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Performance metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    )
  }
})
