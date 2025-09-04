import { NextRequest, NextResponse } from 'next/server'
import { AssetService, UploadAssetRequest, AssetFilters } from '@/lib/assets/asset-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: AssetFilters = {
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      isPublic: searchParams.get('isPublic') ? searchParams.get('isPublic') === 'true' : undefined,
      teamId: searchParams.get('teamId') || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      searchQuery: searchParams.get('search') || undefined
    }

    const assetService = new AssetService()
    const assets = await assetService.getAssets(filters)

    return NextResponse.json(assets)

  } catch (error) {
    console.error('Get assets error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get assets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    const uploadRequest: UploadAssetRequest = {
      file,
      name: formData.get('name') as string || undefined,
      description: formData.get('description') as string || undefined,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',') : undefined,
      isPublic: formData.get('isPublic') === 'true',
      teamId: formData.get('teamId') as string || undefined,
      category: formData.get('category') as any || undefined
    }

    const assetService = new AssetService()
    const asset = await assetService.uploadAsset(uploadRequest)

    return NextResponse.json(asset)

  } catch (error) {
    console.error('Upload asset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload asset' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { assetId, ...updates } = await request.json()

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    const assetService = new AssetService()
    const asset = await assetService.updateAsset(assetId, updates)

    return NextResponse.json(asset)

  } catch (error) {
    console.error('Update asset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update asset' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { assetId } = await request.json()

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    const assetService = new AssetService()
    await assetService.deleteAsset(assetId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
