import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import JSZip from 'jszip'

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

    const { fileIds } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'File IDs array is required' },
        { status: 400 }
      )
    }

    // Get assets from database
    const { data: assets, error: dbError } = await supabase
      .from('user_assets')
      .select('*')
      .in('id', fileIds)
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch assets' },
        { status: 500 }
      )
    }

    if (!assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'No accessible assets found' },
        { status: 404 }
      )
    }

    // Create zip file
    const zip = new JSZip()
    const fileNameCounts: Record<string, number> = {}

    // Download and add each file to zip
    for (const asset of assets) {
      try {
        // Get signed URL for the file
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('assets')
          .createSignedUrl(asset.file_path, 300) // 5 minutes should be enough for zip creation

        if (urlError || !signedUrlData?.signedUrl) {
          console.error(`Failed to get signed URL for asset ${asset.id}:`, urlError)
          continue // Skip this file but continue with others
        }

        // Fetch the file content
        const fileResponse = await fetch(signedUrlData.signedUrl)
        if (!fileResponse.ok) {
          console.error(`Failed to fetch file for asset ${asset.id}:`, fileResponse.statusText)
          continue
        }

        const fileBuffer = await fileResponse.arrayBuffer()
        
        // Handle duplicate filenames by adding a counter
        let fileName = asset.filename
        if (fileNameCounts[fileName]) {
          fileNameCounts[fileName]++
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
          const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : ''
          fileName = `${nameWithoutExt} (${fileNameCounts[fileName]})${extension}`
        } else {
          fileNameCounts[fileName] = 1
        }

        // Add file to zip
        zip.file(fileName, fileBuffer)
      } catch (fileError) {
        console.error(`Error processing asset ${asset.id}:`, fileError)
        continue // Skip this file but continue with others
      }
    }

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    })

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const zipFileName = `media-files-${timestamp}.zip`

    // Return zip file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Bulk download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create zip file' },
      { status: 500 }
    )
  }
}