import { NextRequest, NextResponse } from 'next/server'
import { getListVersionHistory } from '@/lib/supabase/mailing-lists'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId')

    if (!listId) {
      return NextResponse.json(
        { error: 'Missing required field: listId' },
        { status: 400 }
      )
    }

    const versions = await getListVersionHistory(listId)

    return NextResponse.json({
      success: true,
      versions
    })
  } catch (error) {
    console.error('Version history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    )
  }
}
