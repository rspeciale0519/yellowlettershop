import { useState, useCallback } from 'react'
import { UserAsset } from '@/types/supabase'
import { UploadAssetRequest, AssetFilters, AssetUsageStats } from '@/lib/assets/asset-service'

export function useAssets() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [assets, setAssets] = useState<UserAsset[]>([])
  const [stats, setStats] = useState<AssetUsageStats | null>(null)

  const getAssets = useCallback(async (filters: AssetFilters = {}): Promise<UserAsset[]> => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.tags) params.append('tags', filters.tags.join(','))
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
      if (filters.teamId) params.append('teamId', filters.teamId)
      if (filters.createdBy) params.append('createdBy', filters.createdBy)
      if (filters.searchQuery) params.append('search', filters.searchQuery)

      const response = await fetch(`/api/assets?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get assets')
      }

      const assetList = await response.json()
      setAssets(assetList)
      return assetList
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadAsset = useCallback(async (request: UploadAssetRequest): Promise<UserAsset> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', request.file)
      
      if (request.name) formData.append('name', request.name)
      if (request.description) formData.append('description', request.description)
      if (request.tags) formData.append('tags', request.tags.join(','))
      if (request.isPublic) formData.append('isPublic', 'true')
      if (request.teamId) formData.append('teamId', request.teamId)
      if (request.category) formData.append('category', request.category)

      const response = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload asset')
      }

      const asset = await response.json()
      // Don't update local state here - let the parent component handle it via getAssets()
      return asset
    } finally {
      setIsUploading(false)
    }
  }, [])

  const updateAsset = useCallback(async (
    assetId: string,
    updates: {
      name?: string
      description?: string
      tags?: string[]
      isPublic?: boolean
      category?: string
    }
  ): Promise<UserAsset> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/assets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetId, ...updates }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update asset')
      }

      const asset = await response.json()
      setAssets(prev => prev.map(a => a.id === assetId ? asset : a))
      return asset
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteAsset = useCallback(async (assetId: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/assets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete asset')
      }

      setAssets(prev => prev.filter(a => a.id !== assetId))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const recordAssetUsage = useCallback(async (
    assetId: string,
    usageContext?: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/assets/${assetId}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usageContext }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record asset usage')
      }

      // Update local usage count
      setAssets(prev => prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, metadata: { ...asset.metadata, usage_count: (asset.metadata.usage_count || 0) + 1, last_used_at: new Date().toISOString() } }
          : asset
      ))
    } catch (error) {
      console.error('Error recording asset usage:', error)
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }, [])

  const getSignedUrl = useCallback(async (
    assetId: string,
    expiresIn: number = 3600
  ): Promise<string> => {
    try {
      const response = await fetch(`/api/assets/${assetId}/signed-url?expiresIn=${expiresIn}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get signed URL')
      }

      const { signedUrl } = await response.json()
      return signedUrl
    } catch (error) {
      console.error('Error getting signed URL:', error)
      throw error
    }
  }, [])

  const getAssetStats = useCallback(async (userId?: string): Promise<AssetUsageStats> => {
    setIsLoading(true)
    try {
      const url = userId ? `/api/assets/stats?userId=${userId}` : '/api/assets/stats'
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get asset statistics')
      }

      const assetStats = await response.json()
      setStats(assetStats)
      return assetStats
    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadMultipleAssets = useCallback(async (
    files: File[],
    commonOptions: Omit<UploadAssetRequest, 'file'> = {}
  ): Promise<UserAsset[]> => {
    setIsUploading(true)
    try {
      const uploadPromises = files.map(file => 
        uploadAsset({ ...commonOptions, file })
      )

      const results = await Promise.allSettled(uploadPromises)
      
      const successful = results
        .filter((result): result is PromiseFulfilledResult<UserAsset> => result.status === 'fulfilled')
        .map(result => result.value)

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason)

      if (failed.length > 0) {
        console.error('Some uploads failed:', failed)
      }

      return successful
    } finally {
      setIsUploading(false)
    }
  }, [uploadAsset])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const getAssetsByCategory = useCallback((category: string): UserAsset[] => {
    return assets.filter(asset => asset.file_type === category)
  }, [assets])

  const searchAssets = useCallback((query: string): UserAsset[] => {
    const lowercaseQuery = query.toLowerCase()
    return assets.filter(asset => 
      asset.filename.toLowerCase().includes(lowercaseQuery) ||
      asset.original_filename.toLowerCase().includes(lowercaseQuery) ||
      false // Tags will be handled via resource_tags table later
    )
  }, [assets])

  return {
    assets,
    stats,
    isLoading,
    isUploading,
    getAssets,
    uploadAsset,
    updateAsset,
    deleteAsset,
    recordAssetUsage,
    getSignedUrl,
    getAssetStats,
    uploadMultipleAssets,
    formatFileSize,
    getAssetsByCategory,
    searchAssets
  }
}
