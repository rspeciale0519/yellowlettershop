import { createClient } from '@/utils/supabase/client'
import { FileAsset } from '@/types/supabase'
import { recordChange } from '@/lib/version-history/change-tracker'
import { v4 as uuidv4 } from 'uuid'

export interface UploadAssetRequest {
  file: File
  name?: string
  description?: string
  tags?: string[]
  isPublic?: boolean
  teamId?: string
  category?: 'image' | 'document' | 'template' | 'design' | 'other'
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
  recentUploads: FileAsset[]
  mostUsedAssets: Array<{
    asset: FileAsset
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
  async uploadAsset(request: UploadAssetRequest): Promise<FileAsset> {
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
        .upload(filePath, request.file, {
          cacheControl: '3600',
          upsert: false
        })

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
        name: request.name || request.file.name,
        description: request.description,
        file_name: request.file.name,
        file_path: filePath,
        file_size: request.file.size,
        mime_type: request.file.type,
        category: request.category || this.getCategoryFromMimeType(request.file.type),
        tags: request.tags || [],
        is_public: request.isPublic || false,
        storage_url: publicUrl,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: asset, error: dbError } = await this.supabase
        .from('file_assets')
        .insert(assetData)
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await this.supabase.storage.from('assets').remove([filePath])
        throw dbError
      }

      // Record asset creation
      await recordChange('file_asset', asset.id, 'create', {
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
  async getAssets(filters: AssetFilters = {}): Promise<FileAsset[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = this.supabase
      .from('file_assets')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)

    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic)
    }

    if (filters.teamId) {
      query = query.eq('team_id', filters.teamId)
    }

    if (filters.createdBy) {
      query = query.eq('user_id', filters.createdBy)
    }

    if (filters.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data: assets, error } = await query

    if (error) throw error
    return assets || []
  }

  /**
   * Gets a single asset by ID
   */
  async getAsset(assetId: string): Promise<FileAsset | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: asset, error } = await this.supabase
      .from('file_assets')
      .select('*')
      .eq('id', assetId)
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .single()

    if (error) return null
    return asset
  }

  /**
   * Updates asset metadata
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
  ): Promise<FileAsset> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current asset for change tracking
    const { data: currentAsset } = await this.supabase
      .from('file_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!currentAsset) {
      throw new Error('Asset not found or access denied')
    }

    const updateData = {
      name: updates.name,
      description: updates.description,
      tags: updates.tags,
      is_public: updates.isPublic,
      category: updates.category,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const { data: asset, error } = await this.supabase
      .from('file_assets')
      .update(updateData)
      .eq('id', assetId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Record changes
    for (const [field, newValue] of Object.entries(updates)) {
      if (newValue !== undefined && currentAsset[field] !== newValue) {
        await recordChange('file_asset', assetId, 'update', {
          fieldName: field,
          oldValue: currentAsset[field],
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
      .from('file_assets')
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
      .from('file_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id)

    if (dbError) throw dbError

    // Record deletion
    await recordChange('file_asset', assetId, 'delete', {
      oldValue: asset,
      description: `Deleted asset "${asset.name}"`
    })
  }

  /**
   * Shares an asset with a team
   */
  async shareAssetWithTeam(assetId: string, teamId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Verify user owns the asset
    const { data: asset } = await this.supabase
      .from('file_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!asset) {
      throw new Error('Asset not found or access denied')
    }

    // Update asset to include team_id
    const { error } = await this.supabase
      .from('file_assets')
      .update({
        team_id: teamId,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)

    if (error) throw error

    // Record sharing
    await recordChange('file_asset', assetId, 'update', {
      fieldName: 'team_id',
      oldValue: asset.team_id,
      newValue: teamId,
      description: `Shared asset with team`
    })
  }

  /**
   * Records asset usage for analytics
   */
  async recordAssetUsage(assetId: string, usageContext?: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Increment usage count
    const { error: updateError } = await this.supabase
      .from('file_assets')
      .update({
        usage_count: this.supabase.sql`usage_count + 1`,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)

    if (updateError) {
      console.error('Failed to update usage count:', updateError)
    }

    // Record usage event
    const usageData = {
      id: uuidv4(),
      user_id: user.id,
      resource_type: 'file_asset',
      resource_id: assetId,
      action: 'asset_used',
      metadata: {
        context: usageContext
      },
      created_at: new Date().toISOString()
    }

    const { error: usageError } = await this.supabase
      .from('mailing_list_usage')
      .insert(usageData)

    if (usageError) {
      console.error('Failed to record asset usage:', usageError)
    }
  }

  /**
   * Gets asset usage statistics
   */
  async getAssetStats(userId?: string): Promise<AssetUsageStats> {
    const { data: { user } } = await this.supabase.auth.getUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      return this.getEmptyStats()
    }

    try {
      // Get all assets for user
      const { data: assets } = await this.supabase
        .from('file_assets')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (!assets || assets.length === 0) {
        return this.getEmptyStats()
      }

      const totalAssets = assets.length
      const storageUsed = assets.reduce((sum, asset) => sum + asset.file_size, 0)
      const storageLimit = 5 * 1024 * 1024 * 1024 // 5GB default limit

      // Group by category
      const assetsByCategory: Record<string, number> = {}
      assets.forEach(asset => {
        assetsByCategory[asset.category] = (assetsByCategory[asset.category] || 0) + 1
      })

      // Recent uploads (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const recentUploads = assets.filter(asset => asset.created_at >= thirtyDaysAgo)

      // Most used assets
      const mostUsedAssets = assets
        .filter(asset => asset.usage_count > 0)
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10)
        .map(asset => ({
          asset,
          usageCount: asset.usage_count
        }))

      return {
        totalAssets,
        storageUsed,
        storageLimit,
        assetsByCategory,
        recentUploads,
        mostUsedAssets
      }

    } catch (error) {
      console.error('Failed to get asset stats:', error)
      return this.getEmptyStats()
    }
  }

  /**
   * Generates a signed URL for temporary access to a private asset
   */
  async getSignedUrl(assetId: string, expiresIn: number = 3600): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get asset to verify access
    const asset = await this.getAsset(assetId)
    if (!asset) {
      throw new Error('Asset not found or access denied')
    }

    // Generate signed URL
    const { data, error } = await this.supabase.storage
      .from('assets')
      .createSignedUrl(asset.file_path, expiresIn)

    if (error) throw error
    return data.signedUrl
  }

  /**
   * Duplicates an asset
   */
  async duplicateAsset(assetId: string, newName?: string): Promise<FileAsset> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get original asset
    const originalAsset = await this.getAsset(assetId)
    if (!originalAsset) {
      throw new Error('Asset not found or access denied')
    }

    // Download original file
    const { data: fileData, error: downloadError } = await this.supabase.storage
      .from('assets')
      .download(originalAsset.file_path)

    if (downloadError) throw downloadError

    // Create new file from downloaded data
    const file = new File([fileData], originalAsset.file_name, {
      type: originalAsset.mime_type
    })

    // Upload as new asset
    return await this.uploadAsset({
      file,
      name: newName || `Copy of ${originalAsset.name}`,
      description: originalAsset.description,
      tags: originalAsset.tags,
      isPublic: originalAsset.is_public,
      teamId: originalAsset.team_id,
      category: originalAsset.category
    })
  }

  // Private helper methods

  private getCategoryFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
    return 'other'
  }

  private getEmptyStats(): AssetUsageStats {
    return {
      totalAssets: 0,
      storageUsed: 0,
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
      assetsByCategory: {},
      recentUploads: [],
      mostUsedAssets: []
    }
  }
}
