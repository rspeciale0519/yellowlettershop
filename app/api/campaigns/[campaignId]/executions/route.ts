import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCampaignService } from '@/lib/campaigns/enhanced-campaign-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const campaignId = params.campaignId

    const campaignService = new EnhancedCampaignService()
    const executions = await campaignService.getCampaignExecutions(campaignId)

    return NextResponse.json(executions)

  } catch (error) {
    console.error('Get campaign executions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get campaign executions' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { executionId } = await request.json()

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      )
    }

    const campaignService = new EnhancedCampaignService()
    await campaignService.cancelExecution(executionId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Cancel execution error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel execution' },
      { status: 500 }
    )
  }
}
