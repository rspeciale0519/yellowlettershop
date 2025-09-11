import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

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

    const { assetId, expiresInDays } = await request.json()

    if (!assetId) {
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the asset
    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .select('id, filename, user_id')
      .eq('id', assetId)
      .eq('user_id', user.id)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found or access denied' },
        { status: 404 }
      )
    }

    // Check if share link already exists for this asset
    const { data: existingLink } = await supabase
      .from('asset_share_links')
      .select('*')
      .eq('asset_id', assetId)
      .eq('is_active', true)
      .maybeSingle()

    if (existingLink) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
      return NextResponse.json({
        shareUrl: `${baseUrl}/share/${existingLink.share_token}`,
        shareToken: existingLink.share_token,
        expiresAt: existingLink.expires_at
      })
    }

    // Generate expiration date if specified
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)).toISOString()
    }

    // Use service client to call the database function
    const serviceSupabase = createServiceClient()
    const { data: tokenResult } = await serviceSupabase
      .rpc('generate_share_token')

    if (!tokenResult) {
      return NextResponse.json(
        { error: 'Failed to generate share token' },
        { status: 500 }
      )
    }

    // Create share link record
    const { data: shareLink, error: createError } = await serviceSupabase
      .from('asset_share_links')
      .insert({
        asset_id: assetId,
        share_token: tokenResult,
        created_by: user.id,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (createError) {
      console.error('Share link creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    
    return NextResponse.json({
      shareUrl: `${baseUrl}/share/${shareLink.share_token}`,
      shareToken: shareLink.share_token,
      expiresAt: shareLink.expires_at
    })

  } catch (error) {
    console.error('Share link creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create share link' },
      { status: 500 }
    )
  }
}