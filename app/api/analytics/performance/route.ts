import { NextRequest, NextResponse } from 'next/server'
import { EngagementTracker } from '@/lib/analytics/engagement-tracker'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const tracker = new EngagementTracker()
    const metrics = await tracker.getUserPerformanceMetrics(userId || undefined)

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Performance metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    )
  }
}
