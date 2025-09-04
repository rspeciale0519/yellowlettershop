import { NextRequest, NextResponse } from 'next/server'
import { AssetService } from '@/lib/assets/asset-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const assetId = params.assetId
    const { searchParams } = new URL(request.url)
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    const assetService = new AssetService()
    const signedUrl = await assetService.getSignedUrl(assetId, expiresIn)

    return NextResponse.json({ signedUrl })

  } catch (error) {
    console.error('Get signed URL error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get signed URL' },
      { status: 500 }
    )
  }
}
