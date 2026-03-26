import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { createServiceClient } from '@/utils/supabase/service'
import { generateSafeFilename, validateFilename } from '@/lib/utils/filename'

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

    if (error) throw error
    
    // Generate signed URLs for private assets
    const assetsWithSignedUrls = await Promise.all(
      (assets || []).map(async (asset) => {
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Use service role client for storage + DB insert to bypass RLS on server
    const serviceSupabase = createServiceClient()

    // Ensure user profile exists using service client (bypasses RLS)
    const { error: profileError } = await serviceSupabase
      .from('user_profiles')
      .upsert({
        user_id: user.id
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: true 
      })

    if (profileError) {
      console.error('Profile upsert error:', profileError)
    }
    const bucketName = 'assets'

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    const fileId = uuidv4()
    const fileName = formData.get('name') as string || file.name || 'untitled'
    const fileExtension = file.name?.split('.').pop() || 'bin'
    const filePath = `${user.id}/${fileId}.${fileExtension}`

    // Ensure bucket exists (idempotent)
    try {
      const { data: buckets, error: listBucketsError } = await serviceSupabase.storage.listBuckets()
      if (listBucketsError) {
        console.warn('List buckets error (non-fatal):', listBucketsError)
      } else if (!buckets?.some(b => b.name === bucketName)) {
        const { error: createBucketError } = await serviceSupabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 50 * 1024 * 1024,
          allowedMimeTypes: [
            'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/svg+xml',
            'application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4','video/webm','audio/mpeg','audio/wav',
            'font/ttf','font/otf','font/woff','font/woff2'
          ]
        })
        if (createBucketError) {
          console.warn('Create bucket error (non-fatal):', createBucketError)
        }
      }
    } catch (e) {
      console.warn('Bucket ensure exception (non-fatal):', e)
    }

    // Upload file to storage (service role bypasses storage.objects RLS)
    const { error: uploadError } = await serviceSupabase.storage
      .from(bucketName)
      .upload(filePath, file)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Storage upload failed', context: 'storage.upload' },
        { status: 500 }
      )
    }

    // For private buckets, we'll generate signed URLs on demand
    // Store a placeholder URL that indicates signed URL generation
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/assets/${filePath}`

    // Helper function to get category from MIME type
    const getCategoryFromMimeType = (mimeType: string | undefined): string => {
      if (!mimeType) return 'other'

      // Images
      if (mimeType.startsWith('image/')) return 'image'

      // Videos
      if (mimeType.startsWith('video/')) return 'video'

      // Audio
      if (mimeType.startsWith('audio/')) return 'audio'

      // PDFs
      if (mimeType.includes('pdf')) return 'pdf'

      // Excel files
      if (mimeType.includes('spreadsheet') ||
          mimeType.includes('excel') ||
          mimeType === 'application/vnd.ms-excel' ||
          mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return 'spreadsheet'
      }

      // CSV files (group under spreadsheet for filtering)
      if (mimeType === 'text/csv' || mimeType.includes('csv')) {
        return 'spreadsheet'
      }

      // Word documents
      if (mimeType.includes('msword') ||
          mimeType.includes('wordprocessingml.document') ||
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return 'document'
      }

      // Other text/document types
      if (mimeType.includes('text/') || mimeType.includes('document')) return 'document'

      // Fonts
      if (mimeType.includes('font')) return 'font'

      return 'other'
    }

    // Create database record
    const assetData = {
      id: fileId,
      user_id: user.id,
      team_id: formData.get('teamId') as string || null,
      uploaded_by: user.id,
      filename: fileName,
      original_filename: file.name || fileName,
      file_type: getCategoryFromMimeType(file.type),
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size || 0,
      file_path: filePath,
      file_url: publicUrl,
      is_public: formData.get('isPublic') === 'true',
      metadata: {
        tags: formData.get('tags') ? (formData.get('tags') as string).split(',') : [],
        category: formData.get('category') as string || undefined,
        description: formData.get('description') as string || undefined
      },
      created_at: new Date().toISOString()
    }

    // Insert DB record with service role to avoid user_assets RLS edge cases
    const { data: asset, error: dbError } = await serviceSupabase
      .from('user_assets')
      .insert(assetData)
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json(
        { error: dbError.message || 'DB insert failed', context: 'db.insert' },
        { status: 500 }
      )
    }

    // Generate signed URL for the response (same as GET API)
    if (asset && asset.file_path && asset.file_type === 'image') {
      try {
        const { data: signedUrlData } = await supabase.storage
          .from('assets')
          .createSignedUrl(asset.file_path, 3600) // 1 hour expiry
        
        asset.file_url = signedUrlData?.signedUrl || asset.file_url
      } catch (urlError) {
        console.error('Error generating signed URL for uploaded asset:', asset.id, urlError)
        // Continue with placeholder URL if signed URL fails
      }
    }

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

    if (!currentAsset) {
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { assetId } = await request.json()

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    // Get asset for cleanup
    const { data: asset } = await supabase
      .from('user_assets')
      .select('*')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found or access denied' },
        { status: 404 }
      )
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('assets')
      .remove([asset.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('user_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id)

    if (dbError) throw dbError

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete asset' },
      { status: 500 }
    )
  }
}
