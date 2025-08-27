import { NextResponse } from 'next/server'
import type { ListCriteria } from '@/lib/supabase/mailing-lists'
import { fetchRecords } from '@/lib/api/accuzip'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const criteria: ListCriteria | undefined = body?.criteria
    const limit: number = typeof body?.limit === 'number' ? body.limit : 1000
    const offset: number = typeof body?.offset === 'number' ? body.offset : 0

    if (!criteria) {
      return NextResponse.json({ error: 'Missing criteria' }, { status: 400 })
    }

    const result = await fetchRecords(criteria, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    console.error('AccuZIP search error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to search records' },
      { status: 500 }
    )
  }
}
