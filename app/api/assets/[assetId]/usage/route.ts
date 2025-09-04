import { NextRequest, NextResponse } from 'next/server'
import { AssetService } from '@/lib/assets/asset-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const assetId = params.assetId
    const { usageContext } = await request.json()

    const assetService = new AssetService()
    await assetService.recordAssetUsage(assetId, usageContext)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Record asset usage error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record asset usage' },
      { status: 500 }
    )
  }
}
