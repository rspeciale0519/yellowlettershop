import { NextRequest, NextResponse } from 'next/server'
import { deduplicateList } from '@/lib/supabase/mailing-lists-extended'

export async function POST(request: NextRequest) {
  try {
    const { listId, deduplicationField, options } = await request.json()

    if (!listId || !deduplicationField) {
      return NextResponse.json(
        { error: 'Missing required fields: listId, deduplicationField' },
        { status: 400 }
      )
    }

    const result = await deduplicateList(listId, deduplicationField, options || {})

    return NextResponse.json({
      success: true,
      duplicatesFound: result.duplicatesFound,
      removed: result.removed
    })
  } catch (error) {
    console.error('Deduplication error:', error)
    return NextResponse.json(
      { error: 'Failed to deduplicate list' },
      { status: 500 }
    )
  }
}
