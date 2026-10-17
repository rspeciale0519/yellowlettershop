import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCampaignService } from '@/lib/campaigns/enhanced-campaign-service'
import { withProtectedRoute } from '@/lib/auth/with-protected-route'

type RouteParams = { params: { campaignId: string } }

export const POST = withProtectedRoute<RouteParams>(async (
  request: NextRequest,
  _ctx,
  { params }
) => {
  try {
    const campaignId = params.campaignId
    const { executionId } = await request.json()

    const campaignService = new EnhancedCampaignService()
    await campaignService.executeCampaign(campaignId, executionId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Campaign execution error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute campaign' },
      { status: 500 }
    )
  }
})
