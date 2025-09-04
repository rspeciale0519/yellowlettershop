import { NextRequest, NextResponse } from 'next/server'
import { AssetService } from '@/lib/assets/asset-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const assetService = new AssetService()
    const stats = await assetService.getAssetStats(userId || undefined)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Get asset stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get asset statistics' },
      { status: 500 }
    )
  }
}
