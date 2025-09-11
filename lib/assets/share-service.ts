import { createServiceClient } from '@/utils/supabase/service'

export interface ShareLinkData {
  id: string
  asset_id: string
  share_token: string
  expires_at: string | null
  access_count: number
  asset: {
    filename: string
    file_size: number
    file_type: string
    mime_type: string
    file_path: string
    created_at: string
  }
}

export interface StreamFileResult {
  fileBuffer: Uint8Array
  filename: string
  mimeType: string
  fileSize: number
}

/**
 * Service for managing secure file sharing and streaming
 * Handles share link validation and file streaming without exposing signed URLs
 */
export class ShareService {
  private supabase = createServiceClient()

  /**
   * Validates share token and returns share link data
   */
  async validateShareToken(token: string): Promise<ShareLinkData | null> {
    try {
      // Fetch share link with asset data
      const { data, error } = await this.supabase
        .from('asset_share_links')
        .select(`
          *,
          asset:user_assets (
            filename,
            file_size,
            file_type,
            mime_type,
            file_path,
            created_at
          )
        `)
        .eq('share_token', token)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return null
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null
      }

      return data as ShareLinkData
    } catch (error) {
      console.error('Share token validation error:', error)
      return null
    }
  }

  /**
   * Increments access count for a share link
   */
  async incrementAccessCount(shareId: string, currentCount: number): Promise<void> {
    try {
      await this.supabase
        .from('asset_share_links')
        .update({ access_count: currentCount + 1 })
        .eq('id', shareId)
    } catch (error) {
      console.error('Failed to increment access count:', error)
      // Don't throw - this is non-critical
    }
  }

  /**
   * Streams file data from storage without exposing signed URL
   */
  async streamFile(filePath: string): Promise<StreamFileResult | null> {
    try {
      // Get signed URL from storage
      const { data: signedUrlData, error: urlError } = await this.supabase.storage
        .from('assets')
        .createSignedUrl(filePath, 300) // 5 minute expiry for internal use

      if (urlError || !signedUrlData?.signedUrl) {
        console.error('Failed to create signed URL for streaming:', urlError)
        return null
      }

      // Fetch file data
      const response = await fetch(signedUrlData.signedUrl)
      
      if (!response.ok) {
        console.error('Failed to fetch file for streaming:', response.statusText)
        return null
      }

      const fileBuffer = new Uint8Array(await response.arrayBuffer())
      const filename = filePath.split('/').pop() || 'file'
      const mimeType = response.headers.get('content-type') || 'application/octet-stream'
      const fileSize = parseInt(response.headers.get('content-length') || '0')

      return {
        fileBuffer,
        filename,
        mimeType,
        fileSize
      }
    } catch (error) {
      console.error('File streaming error:', error)
      return null
    }
  }
}

// Export singleton instance
export const shareService = new ShareService()