import { NextRequest, NextResponse } from 'next/server'
import { EnhancedCampaignService, CreateCampaignRequest } from '@/lib/campaigns/enhanced-campaign-service'

export async function POST(request: NextRequest) {
  try {
    const requestData: CreateCampaignRequest = await request.json()

    if (!requestData.name || !requestData.contactCardId || !requestData.mailingListIds?.length) {
      return NextResponse.json(
        { error: 'Campaign name, contact card ID, and mailing list IDs are required' },
        { status: 400 }
      )
    }

    const campaignService = new EnhancedCampaignService()
    const campaign = await campaignService.createCampaign(requestData)

    return NextResponse.json(campaign)

  } catch (error) {
    console.error('Enhanced campaign creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { campaignId, ...updates } = await request.json()

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    const campaignService = new EnhancedCampaignService()
    const campaign = await campaignService.updateCampaign(campaignId, updates)

    return NextResponse.json(campaign)

  } catch (error) {
    console.error('Enhanced campaign update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
