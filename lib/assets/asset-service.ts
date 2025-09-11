import { createClient } from '@/utils/supabase/client'
import { UserAsset } from '@/types/supabase'
import { recordChange } from '@/lib/version-history/change-tracker'
import { v4 as uuidv4 } from 'uuid'

export interface UploadAssetRequest {
  file: File
  name?: string
  description?: string
  tags?: string[]
  isPublic?: boolean
  teamId?: string
  category?: string
}

export interface AssetFilters {
  category?: string
  tags?: string[]
  isPublic?: boolean
  teamId?: string
  createdBy?: string
  searchQuery?: string
}

export interface AssetUsageStats {
  totalAssets: number
  storageUsed: number
  storageLimit: number
  assetsByCategory: Record<string, number>
  recentUploads: UserAsset[]
  mostUsedAssets: Array<{
    asset: UserAsset
    usageCount: number
  }>
}

/**
 * Service for managing file assets, uploads, and media library
 */
export class AssetService {
  private supabase = createClient()

  /**
   * Uploads a file asset to storage and creates database record
   */
  async uploadAsset(request: UploadAssetRequest): Promise<UserAsset> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const fileId = uuidv4()
    const fileExtension = request.file.name.split('.').pop()
    const fileName = `${fileId}.${fileExtension}`
    const filePath = `assets/${user.id}/${fileName}`

    try {
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('assets')
        .upload(filePath, request.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('assets')
        .getPublicUrl(filePath)

      // Create database record
      const assetData = {
        id: fileId,
        user_id: user.id,
        team_id: request.teamId,
        uploaded_by: user.id,
        filename: fileName,
        original_filename: request.file.name,
        file_type: this.getCategoryFromMimeType(request.file.type),
        mime_type: request.file.type,
        file_size: request.file.size,
        file_path: filePath,
        file_url: publicUrl,
        is_public: request.isPublic || false,
        metadata: {
          tags: request.tags || [],
          category: request.category,
          description: request.description
        },
        created_at: new Date().toISOString()
      }

      const { data: asset, error: dbError } = await this.supabase
        .from('user_assets')
        .insert(assetData)
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('assets').remove([filePath])
        throw dbError
      }

      // Record asset creation
      await recordChange('asset', asset.id, 'create', {
        newValue: asset,
        description: `Uploaded asset "${request.name || request.file.name}"`
      })

      return asset

    } catch (error) {
      console.error('Asset upload error:', error)
      throw error
    }
  }

  /**
   * Gets assets with optional filtering
   */
  async getAssets(filters: AssetFilters = {}): Promise<UserAsset[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = this.supabase
      .from('user_assets')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)

    if (filters.category) {
      query = query.eq('file_type', filters.category)
    }

    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic)
    }

    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId)
    }

    if (filters.createdBy) {
      query = query.eq('uploaded_by', filters.createdBy)
    }

    if (filters.searchQuery) {
      query = query.or(`filename.ilike.%${filters.searchQuery}%,original_filename.ilike.%${filters.searchQuery}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data: assets, error } = await query

    if (error) throw error
    return assets || []
  }

  /**
   * Gets a single asset by ID
   */
  async getAsset(assetId: string): Promise<UserAsset | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: asset, error } = await this.supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .single()

    if (error) return null
    return asset
  }

  /**
   * Updates an asset's metadata
   */
  async updateAsset(
    assetId: string,
    updates: {
      name?: string
      description?: string
      tags?: string[]
      isPublic?: boolean
      category?: string
    }
  ): Promise<UserAsset> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current asset for change tracking
    const { data: currentAsset } = await this.supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!currentAsset) {
      throw new Error('Asset not found or access denied')
    }

    const updateData: any = {}
    
    if (updates.name) updateData.filename = updates.name
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
    if (updates.category) updateData.file_type = updates.category
    
    // Update metadata
    const currentMetadata = currentAsset.metadata || {}
    const newMetadata = { ...currentMetadata }
    
    if (updates.description !== undefined) newMetadata.description = updates.description
    if (updates.tags !== undefined) newMetadata.tags = updates.tags
    if (updates.category !== undefined) newMetadata.category = updates.category
    
    updateData.metadata = newMetadata

    const { data: asset, error } = await this.supabase
      .from('user_assets')
      .update(updateData)
      .eq('id', assetId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Record changes
    for (const [field, newValue] of Object.entries(updates)) {
      if (newValue !== undefined) {
        await recordChange('asset', assetId, 'update', {
          fieldName: field,
          oldValue: (currentAsset as any)[field],
          newValue,
          description: `Updated asset ${field}`
        })
      }
    }

    return asset
  }

  /**
   * Deletes an asset and its file
   */
  async deleteAsset(assetId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get asset for cleanup and change tracking
    const { data: asset } = await this.supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!asset) {
      throw new Error('Asset not found or access denied')
    }

    // Delete file from storage
    const { error: storageError } = await this.supabase.storage
      .from('assets')
      .remove([asset.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete database record
    const { error: dbError } = await this.supabase
      .from('user_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id)

    if (dbError) throw dbError

    // Record deletion
    await recordChange('asset', assetId, 'delete', {
      oldValue: asset,
      description: `Deleted asset "${asset.filename}"`
    })
  }

  /**
   * Gets asset usage statistics for the user
   */
  async getAssetStats(userId?: string): Promise<AssetUsageStats> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const targetUserId = userId || user.id

    const { data: assets, error } = await this.supabase
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

    return {
      totalAssets,
      storageUsed,
      storageLimit,
      assetsByCategory,
      recentUploads: assets?.slice(-5) || [],
      mostUsedAssets: [] // Will be populated when usage tracking is implemented
    }
  }

  /**
   * Determines file category from MIME type
   */
  private getCategoryFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'document'
    if (mimeType.includes('text/') || mimeType.includes('document')) return 'document'
    if (mimeType.includes('font')) return 'font'
    return 'other'
  }

  /**
   * Gets a signed URL for accessing a private asset
   */
  async getSignedUrl(assetId: string, expiresIn: number = 3600): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the asset to verify access and get file path
    const { data: asset, error } = await this.supabase
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

    // Generate signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await this.supabase.storage
      .from('assets')
      .createSignedUrl(asset.file_path, expiresIn)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL generation error:', signedUrlError)
      throw new Error('Failed to generate signed URL')
    }

    return signedUrlData.signedUrl
  }
}

// Export singleton instance
export const assetService = new AssetService()
