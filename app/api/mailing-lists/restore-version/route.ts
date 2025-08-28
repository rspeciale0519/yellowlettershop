import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { restoreListVersion } from '@/lib/supabase/mailing-lists-extended'

const RestoreVersionSchema = z.object({
  listId: z.string().min(1, 'listId is required'),
  versionId: z.string().min(1, 'versionId is required')
})

export async function POST(request: NextRequest) {
  try {
    // Check Content-Type
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const parsed = RestoreVersionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { listId, versionId } = parsed.data

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
