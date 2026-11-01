import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { generateSafeFilename, validateFilename } from '@/lib/utils/filename'
import { isOwnedAssetPath } from '@/lib/assets/ownership'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { assetId, ...updates } = await request.json()

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    // Get current asset
    const { data: currentAsset } = await supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!currentAsset || !isOwnedAssetPath(currentAsset.file_path, user.id)) {
      return NextResponse.json(
        { error: 'Asset not found or access denied' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    let newFilePath = currentAsset.file_path

    // Handle file renaming (requires storage file move)
    if (updates.name && updates.name !== currentAsset.filename) {
      const validation = validateFilename(updates.name)
      if (validation) {
        return NextResponse.json(
          { error: validation },
          { status: 400 }
        )
      }

      // Extract the display name without extension for sanitization
      const nameWithoutExtension = updates.name.replace(/\.[^/.]+$/, '')

      // Generate safe filename for storage
      const { sanitizedFilename, displayName } = generateSafeFilename(
        currentAsset.filename,
        nameWithoutExtension
      )

      try {
        const serviceSupabase = createServiceClient()

        // Extract the current filename from file_path for comparison
        const currentFileNameInPath = currentAsset.file_path.split('/').pop()

        // Always attempt to rename the file in storage if the names are different
        if (sanitizedFilename !== currentFileNameInPath) {
          // Generate new file path
          const pathParts = currentAsset.file_path.split('/')
          pathParts[pathParts.length - 1] = sanitizedFilename
          newFilePath = pathParts.join('/')

          // Move file in storage
          const { error: moveError } = await serviceSupabase.storage
            .from('assets')
            .move(currentAsset.file_path, newFilePath)

          if (moveError) {
            console.error('File move error:', moveError)
            return NextResponse.json(
              { error: `Failed to rename file in storage: ${moveError.message}` },
              { status: 500 }
            )
          }

          // Update both filename and file_path
          updateData.filename = displayName
          updateData.file_path = newFilePath
        } else {
          // Just update display name if storage name doesn't need to change
          updateData.filename = updates.name
        }
      } catch (error) {
        console.error('Rename operation failed:', error)
        return NextResponse.json(
          { error: 'Failed to rename file' },
          { status: 500 }
        )
      }
    }

    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic
    if (updates.category) updateData.file_type = updates.category

    // Update metadata
    const currentMetadata = currentAsset.metadata || {}
    const newMetadata = { ...currentMetadata }

    if (updates.description !== undefined) newMetadata.description = updates.description
    if (updates.tags !== undefined) newMetadata.tags = updates.tags
    if (updates.category !== undefined) newMetadata.category = updates.category

    updateData.metadata = newMetadata

    // Use service client for the database update to ensure it works with RLS
    const serviceSupabase = createServiceClient()
    const { data: asset, error } = await serviceSupabase
      .from('user_assets')
      .update(updateData)
      .eq('id', assetId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    // Generate signed URL for response if it's an image
    if (asset && asset.file_path && asset.file_type === 'image') {
      try {
        const { data: signedUrlData } = await supabase.storage
          .from('assets')
          .createSignedUrl(asset.file_path, 3600)

        asset.file_url = signedUrlData?.signedUrl || asset.file_url
      } catch (urlError) {
        console.error('Error generating signed URL for updated asset:', urlError)
        // Continue without signed URL
      }
    }

    return NextResponse.json(asset)

  } catch (error) {
    console.error('Update asset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update asset' },
      { status: 500 }
    )
  }
}
