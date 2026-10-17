import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { isMissingUserAssetsTable, listStorageImageAssets } from '@/lib/assets/storage-fallback'
import { isOwnedAssetPath } from '@/lib/assets/ownership'

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

    let query = supabase
      .from('user_assets')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)

    const category = searchParams.get('category')
    if (category) {
      query = query.eq('file_type', category)
    }

    const isPublic = searchParams.get('isPublic')
    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true')
    }

    const teamId = searchParams.get('teamId')
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const createdBy = searchParams.get('createdBy')
    if (createdBy) {
      query = query.eq('uploaded_by', createdBy)
    }

    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      query = query.or(`filename.ilike.%${searchQuery}%,original_filename.ilike.%${searchQuery}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data: assets, error } = await query

    if (error) {
      if (isMissingUserAssetsTable(error) && category === 'image') {
        const serviceSupabase = createServiceClient()
        return NextResponse.json(await listStorageImageAssets(serviceSupabase, 'assets', user.id))
      }
      throw error
    }

    // Generate signed URLs for private assets
    const assetsWithSignedUrls = await Promise.all(
      (assets || []).filter(asset => isOwnedAssetPath(asset.file_path, asset.user_id)).map(async (asset) => {
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
            console.error('Error generating signed URL for asset:', asset.id, urlError)
            return asset
          }
        }
        return asset
      })
    )

    return NextResponse.json(assetsWithSignedUrls)

  } catch (error) {
    console.error('Get assets error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get assets' },
      { status: 500 }
    )
  }
}
