import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId') || user.id

    const { data: assets, error } = await supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', targetUserId)

    if (error) throw error

    const totalAssets = assets?.length || 0
    const storageUsed = assets?.reduce((sum, asset) => sum + asset.file_size, 0) || 0
    
    // Mock storage limit - will be replaced with actual quota system
    const storageLimit = 100 * 1024 * 1024 // 100MB default
    
    const assetsByCategory: Record<string, number> = {}
    assets?.forEach(asset => {
      const category = asset.file_type || 'other'
      assetsByCategory[category] = (assetsByCategory[category] || 0) + 1
    })
    
    // Generate signed URLs for recent uploads (images only)
    const recentUploads = await Promise.all(
      (assets?.slice(0, 10) || []).map(async (asset) => {
        if (asset.file_path && asset.file_type === 'image') {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('assets')
              .createSignedUrl(asset.file_path, 3600) // 1 hour expiry
            
            return {
              ...asset,
              file_url: signedUrlData?.signedUrl || asset.file_url
            }
          } catch (urlError) {
            console.error('Error generating signed URL for recent upload:', asset.id, urlError)
            return asset
          }
        }
        return asset
      })
    )
    
    const stats = {
      totalAssets,
      storageUsed,
      storageLimit,
      assetsByCategory,
      recentUploads,
      mostUsedAssets: [] // Will be implemented when usage tracking is added
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Get asset stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get asset statistics' },
      { status: 500 }
    )
  }
}
