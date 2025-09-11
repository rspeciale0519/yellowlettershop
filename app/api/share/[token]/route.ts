import { NextRequest, NextResponse } from 'next/server'
import { shareService } from '@/lib/assets/share-service'

/**
 * Secure file streaming endpoint for share links
 * Streams file content directly without exposing signed URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      )
    }

    // Validate share token and get share data
    const shareData = await shareService.validateShareToken(token)

    if (!shareData) {
      return NextResponse.json(
        { error: 'Share link not found or has expired' },
        { status: 404 }
      )
    }

    // Stream file from storage
    const fileResult = await shareService.streamFile(shareData.asset.file_path)

    if (!fileResult) {
      return NextResponse.json(
        { error: 'Failed to load file' },
        { status: 500 }
      )
    }

    // Increment access count (async, non-blocking)
    shareService.incrementAccessCount(shareData.id, shareData.access_count)

    // Return file with appropriate headers
    const response = new NextResponse(fileResult.fileBuffer)
    
    // Set proper headers for file streaming
    response.headers.set('Content-Type', shareData.asset.mime_type || fileResult.mimeType)
    response.headers.set('Content-Length', fileResult.fileSize.toString())
    response.headers.set('Content-Disposition', `inline; filename="${shareData.asset.filename}"`)
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    
    // Cache headers (24 hours for shared files)
    response.headers.set('Cache-Control', 'public, max-age=86400')
    response.headers.set('ETag', `"${token}-${shareData.access_count}"`)

    return response

  } catch (error) {
    console.error('Share file streaming error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}