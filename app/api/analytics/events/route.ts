import { NextRequest, NextResponse } from 'next/server'
import { EngagementTracker } from '@/lib/analytics/engagement-tracker'

export async function POST(request: NextRequest) {
  try {
    const { eventType, eventData, campaignId, recipientId } = await request.json()

    if (!eventType || !eventData) {
      return NextResponse.json(
        { error: 'Event type and data are required' },
        { status: 400 }
      )
    }

    const tracker = new EngagementTracker()
    await tracker.recordEngagementEvent(eventType, eventData, campaignId, recipientId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Engagement event recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record engagement event' },
      { status: 500 }
    )
  }
}
