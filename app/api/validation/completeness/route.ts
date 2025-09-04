import { NextRequest, NextResponse } from 'next/server'
import { calculateCompletenessScore, batchCalculateCompleteness, getCompletenessStats } from '@/lib/validation/data-completeness'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { record, records, options = {} } = body

    // Single record completeness scoring
    if (record && typeof record === 'object') {
      const result = calculateCompletenessScore(record, options)
      return NextResponse.json({ success: true, result })
    }

    // Batch completeness scoring
    if (records && Array.isArray(records)) {
      if (records.length > 1000) {
        return NextResponse.json(
          { error: 'Maximum 1000 records per batch' },
          { status: 400 }
        )
      }

      const results = batchCalculateCompleteness(records, options)
      const stats = getCompletenessStats(results)
      
      return NextResponse.json({ 
        success: true, 
        results,
        stats
      })
    }

    return NextResponse.json(
      { error: 'Either record or records array is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Completeness scoring error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate completeness score' },
      { status: 500 }
    )
  }
}
