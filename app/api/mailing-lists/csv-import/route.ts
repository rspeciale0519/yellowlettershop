import { NextRequest, NextResponse } from 'next/server'
import { bulkImportRecords } from '@/lib/supabase/mailing-lists-extended/csv'

export async function POST(request: NextRequest) {
  try {
    const { listId, records, deduplicationField } = await request.json()

    if (!listId || !records) {
      return NextResponse.json(
        { error: 'Missing required fields: listId, records' },
        { status: 400 }
      )
    }

    const result = await bulkImportRecords(listId, records, deduplicationField)

    return NextResponse.json({
      success: true,
      imported: result.success,
      failed: result.failed,
      duplicates: result.duplicates
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to import CSV records' },
      { status: 500 }
    )
  }
}
