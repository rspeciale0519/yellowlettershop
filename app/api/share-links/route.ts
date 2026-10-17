import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { hashShareToken, parseShareExpiryDays, SHARE_LINK_MAX_DAYS } from '@/lib/assets/share-token'

function shareUrl(request: NextRequest, token: string) {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}/share/${token}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json() as { assetId?: string; expiresInDays?: unknown }
    if (!body.assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }
    const expiry = parseShareExpiryDays(body.expiresInDays)
    if (!expiry.ok) {
      return NextResponse.json({ error: expiry.error }, { status: 400 })
    }

    const { data: asset, error: assetError } = await supabase
      .from('user_assets')
      .select('id, filename, user_id')
      .eq('id', body.assetId)
      .eq('user_id', user.id)
      .single()
    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found or access denied' }, { status: 404 })
    }

    const serviceSupabase = createServiceClient()
    const { data: tokenResult } = await serviceSupabase.rpc('generate_share_token')
    if (!tokenResult || typeof tokenResult !== 'string') {
      return NextResponse.json({ error: 'Failed to generate share token' }, { status: 500 })
    }

    const expiresAt = new Date(Date.now() + expiry.days * 24 * 60 * 60 * 1000).toISOString()
    const { data: shareLink, error: createError } = await serviceSupabase
      .from('asset_share_links')
      .insert({
        asset_id: body.assetId,
        share_token: hashShareToken(tokenResult),
        created_by: user.id,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('id, expires_at')
      .single()

    if (createError || !shareLink) {
      console.error('Share link creation error:', createError)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    return NextResponse.json({
      shareUrl: shareUrl(request, tokenResult),
      shareToken: tokenResult,
      expiresAt: shareLink.expires_at,
      maxDays: SHARE_LINK_MAX_DAYS,
    })
  } catch (error) {
    console.error('Share link creation error:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json() as { token?: string; assetId?: string }
    const serviceSupabase = createServiceClient()
    let query = serviceSupabase
      .from('asset_share_links')
      .update({ is_active: false })
      .eq('created_by', user.id)
      .eq('is_active', true)
    if (body.token) query = query.eq('share_token', hashShareToken(body.token))
    else if (body.assetId) query = query.eq('asset_id', body.assetId)
    else return NextResponse.json({ error: 'Token or asset ID is required' }, { status: 400 })

    const { error } = await query
    if (error) {
      console.error('Share link revoke error:', error)
      return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
    }
    return NextResponse.json({ revoked: true })
  } catch (error) {
    console.error('Share link revoke error:', error)
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 })
  }
}
