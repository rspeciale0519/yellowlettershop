import { NextRequest, NextResponse } from 'next/server'
import { restoreListVersion } from '@/lib/supabase/mailing-lists-extended'

export async function POST(request: NextRequest) {
  try {
    const { listId, versionId } = await request.json()

    if (!listId || !versionId) {
      return NextResponse.json(
        { error: 'Missing required fields: listId, versionId' },
        { status: 400 }
      )
    }

    await restoreListVersion(listId, versionId)

    return NextResponse.json({
      success: true,
      message: 'Version restored successfully'
    })
  } catch (error) {
    console.error('Version restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore version' },
      { status: 500 }
    )
  }
}
