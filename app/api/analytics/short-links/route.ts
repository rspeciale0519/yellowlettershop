import { NextRequest, NextResponse } from 'next/server'
import { EngagementTracker } from '@/lib/analytics/engagement-tracker'
import { withAuth } from '@/lib/auth/middleware'

export const POST = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { originalUrl, options } = await request.json()

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'Original URL is required' },
        { status: 400 }
      )
    }

    const tracker = new EngagementTracker()
    const shortLink = await tracker.createShortLink(originalUrl, options)

    return NextResponse.json(shortLink)

  } catch (error) {
    console.error('Short link creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create short link' },
      { status: 500 }
    )
  }
})

export const GET = withAuth(async (request: NextRequest, { userId }) => {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    const tracker = new EngagementTracker()
    const metrics = await tracker.getCampaignMetrics(campaignId)

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Campaign metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to get campaign metrics' },
      { status: 500 }
    )
  }
})
