import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCampaignService } from '@/lib/campaigns/enhanced-campaign-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
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
}
