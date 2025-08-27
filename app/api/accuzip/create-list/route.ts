import { NextResponse } from 'next/server'
import type { ListCriteria } from '@/lib/supabase/mailing-lists'
import { createListFromAccuZIPCriteria } from '@/lib/api/accuzip-integration'
import { createMailingList as createMailingListServer } from '@/lib/supabase/server-mailing-lists'
import { bulkImportRecords as bulkImportRecordsServer } from '@/lib/supabase/server-mailing-lists-extended'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name: string | undefined = body?.name
    const criteria: ListCriteria | undefined = body?.criteria
    const options = body?.options as {
      sampleSize?: number
      deduplicationField?: string
      description?: string
      fetchLimit?: number
    } | undefined

    if (!name || !criteria) {
      return NextResponse.json({ error: 'Missing name or criteria' }, { status: 400 })
    }

    const result = await createListFromAccuZIPCriteria(
      name,
      criteria,
      options,
      {
        createMailingList: createMailingListServer,
        bulkImportRecords: bulkImportRecordsServer,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create list' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('AccuZIP create-list error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create list' },
      { status: 500 }
    )
  }
}
