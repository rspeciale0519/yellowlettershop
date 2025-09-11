import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const assetId = params.assetId
    const { searchParams } = new URL(request.url)
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    // Get the asset to verify access and get file path
    const { data: asset, error } = await supabase
      .from('user_assets')
      .select('file_path, user_id, is_public')
      .eq('id', assetId)
      .single()

    if (error || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this asset
    if (asset.user_id !== user.id && !asset.is_public) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate signed URL for the file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('assets')
      .createSignedUrl(asset.file_path, expiresIn)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL generation error:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl })

  } catch (error) {
    console.error('Get signed URL error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get signed URL' },
      { status: 500 }
    )
  }
}
