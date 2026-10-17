import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { createServiceClient } from '@/utils/supabase/service'
import { isMissingUserAssetsTable, listStorageImageAssets, storageAssetId, withSignedAssetUrl } from '@/lib/assets/storage-fallback'

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
    const fileName = ((formData.get('name') as string) || file.name || 'untitled').trim()
    const fileExtension = file.name?.split('.').pop() || 'bin'
    const filePath = `${user.id}/${fileId}.${fileExtension}`
    const fileType = getCategoryFromMimeType(file.type)

    const duplicateCheck = serviceSupabase
      .from('user_assets')
      .select('id')
      .eq('user_id', user.id)
      .eq('file_type', fileType)
      .ilike('filename', fileName)
      .limit(1)
    const { data: duplicateAssets, error: duplicateError } = await duplicateCheck

    if (duplicateError && !isMissingUserAssetsTable(duplicateError)) {
      return NextResponse.json(
        { error: duplicateError.message || 'Unable to validate image name', context: 'name.check' },
        { status: 500 }
      )
    }

    if (duplicateAssets?.length) {
      return NextResponse.json(
        { error: 'You already have an image with this name', context: 'name.duplicate' },
        { status: 409 }
      )
    }

    if (isMissingUserAssetsTable(duplicateError) && fileType === 'image') {
      const storageAssets = await listStorageImageAssets(serviceSupabase, bucketName, user.id)
      const duplicateStorageAsset = storageAssets.some((asset) => asset.filename.trim().toLowerCase() === fileName.toLowerCase())
      if (duplicateStorageAsset) {
        return NextResponse.json(
          { error: 'You already have an image with this name', context: 'name.duplicate' },
          { status: 409 }
        )
      }
    }

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
      .upload(filePath, file, { metadata: { friendlyName: fileName } })

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

    function getCategoryFromMimeType(mimeType: string | undefined): string {
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
      file_type: fileType,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert DB record with service role to avoid user_assets RLS edge cases
    const { data: asset, error: dbError } = await serviceSupabase
      .from('user_assets')
      .insert(assetData)
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error:', dbError)
      if (isMissingUserAssetsTable(dbError) && assetData.file_type === 'image') {
        const storageOnlyAsset = await withSignedAssetUrl(serviceSupabase, bucketName, {
          ...assetData,
          id: storageAssetId(assetData.file_path),
          team_id: assetData.team_id ?? null,
          file_url: assetData.file_url,
          metadata: { ...assetData.metadata, storageOnly: true }
        })
        return NextResponse.json(storageOnlyAsset)
      }
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
