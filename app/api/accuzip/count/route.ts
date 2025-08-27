import { NextResponse } from 'next/server'
import type { ListCriteria } from '@/lib/supabase/mailing-lists'
import { estimateRecordCount } from '@/lib/api/accuzip'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const criteria: ListCriteria | undefined = body?.criteria

    if (!criteria) {
      return NextResponse.json({ error: 'Missing criteria' }, { status: 400 })
    }

    const count = await estimateRecordCount(criteria)
    return NextResponse.json({ count })
  } catch (err) {
    console.error('AccuZIP count error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to estimate count' },
      { status: 500 }
    )
  }
}
