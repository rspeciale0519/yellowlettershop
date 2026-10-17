import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { isOwnedAssetPath } from '@/lib/assets/ownership'

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

    if (!asset || !isOwnedAssetPath(asset.file_path, user.id)) {
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
