import type { SupabaseClient } from '@supabase/supabase-js'
import type { AssetUsageStats } from './asset-service'
import { isOwnedAssetPath } from './ownership'

export async function assetStats(client: SupabaseClient, userId?: string): Promise<AssetUsageStats> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const targetUserId = userId || user.id

    const { data, error } = await client
      .from('user_assets')
      .select('*')
      .eq('user_id', targetUserId)

    if (error) throw error
    const assets = data?.filter(asset => isOwnedAssetPath(asset.file_path, asset.user_id))

    const totalAssets = assets?.length || 0
    const storageUsed = assets?.reduce((sum, asset) => sum + asset.file_size, 0) || 0

    // Mock storage limit - will be replaced with actual quota system
    const storageLimit = 100 * 1024 * 1024 // 100MB default

    const assetsByCategory: Record<string, number> = {}
    assets?.forEach(asset => {
      const category = asset.file_type || 'other'
      assetsByCategory[category] = (assetsByCategory[category] || 0) + 1
    })

    return {
      totalAssets,
      storageUsed,
      storageLimit,
      assetsByCategory,
      recentUploads: assets?.slice(-5) || [],
      mostUsedAssets: [] // Will be populated when usage tracking is implemented
    }
  }

export async function signedAssetUrl(client: SupabaseClient, assetId: string, expiresIn = 3600): Promise<string> {
    const { data: { user } } = await client.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the asset to verify access and get file path
    const { data: asset, error } = await client
      .from('user_assets')
      .select('file_path, user_id, is_public')
      .eq('id', assetId)
      .single()

    if (error || !asset) {
      throw new Error('Asset not found')
    }

    // Check if user has access to this asset
    if (asset.user_id !== user.id && !asset.is_public) {
      throw new Error('Access denied')
    }

    if (!isOwnedAssetPath(asset.file_path, asset.user_id)) throw new Error('Invalid asset storage ownership')

    // Generate signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from('assets')
      .createSignedUrl(asset.file_path, expiresIn)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL generation error:', signedUrlError)
      throw new Error('Failed to generate signed URL')
    }

    return signedUrlData.signedUrl
  }
