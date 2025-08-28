import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { deduplicateList } from '@/lib/supabase/mailing-lists-extended'
import { createServerClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const PayloadSchema = z.object({
      listId: z.string().min(1, 'listId is required'),
      deduplicationField: z.enum(['email', 'phone', 'externalId']), // adjust to your allowed fields
      options: z.record(z.unknown()).optional().default({}),
    })

    const raw = await request.json().catch(() => null)
    if (!raw) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const parsed = PayloadSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { listId, deduplicationField, options } = parsed.data
    // Auth
    const supabase = await createServerClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    const user = userData.user

    // Authorization: ensure the user owns the list
    const { data: mailingList, error: listError } = await supabase
      .from('mailing_lists')
      .select('id, created_by')
      .eq('id', listId)
      .single()

    if (listError || !mailingList) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }
    if (mailingList.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to manage this list' },
        { status: 403 }
      )
    }

    // Whitelist mapping (defense-in-depth)
    type FieldColumn = Parameters<typeof deduplicateList>[1]
    const fieldMap: Record<'email' | 'phone' | 'externalId', FieldColumn> = {
      email: 'email',
      phone: 'phone',
      externalId: 'external_id',
    }
    const column = fieldMap[deduplicationField]

    const result = await deduplicateList(listId, column, options)

    return NextResponse.json({
      success: true,
      duplicatesFound: result.duplicatesFound,
      removed: result.removed,
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
