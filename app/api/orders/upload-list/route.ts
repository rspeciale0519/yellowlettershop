import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { mapRowsToRecords } from '@/lib/orders/upload-list-mapper'

// Persist an order-wizard CSV upload into a real, owner-scoped mailing list so
// address validation + fulfillment operate on DB records rather than only the
// client's previewData. Creates one `mailing_lists` row and bulk-inserts the
// mapped rows into `mailing_list_records` (recognized fields -> typed columns,
// extras -> additional_data). Returns the new mailing_list_id.

const MAX_ROWS = 100_000
const BATCH_SIZE = 500

const UploadListSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  mappedFields: z.record(z.string().nullable()),
  rows: z.array(z.record(z.unknown())).min(1).max(MAX_ROWS),
})

export const POST = withAuth(async (req: NextRequest, { userId }: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { name, mappedFields, rows } = UploadListSchema.parse(body)

    const supabase = createClient()

    // Resolve the user's team (if any) so the list is team-scoped exactly like
    // sibling owner-scoped tables; null team => personal list.
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('team_id')
      .eq('user_id', userId)
      .maybeSingle()
    const teamId = (profile?.team_id as string | null | undefined) ?? null

    const listName =
      name && name.length > 0
        ? name
        : `Order upload ${new Date().toISOString().slice(0, 10)}`

    const { data: list, error: listError } = await supabase
      .from('mailing_lists')
      .insert({
        name: listName,
        created_by: userId,
        team_id: teamId,
        record_count: 0,
        source_type: 'upload',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (listError || !list) {
      console.error('upload-list: failed to create mailing list', listError)
      return NextResponse.json({ error: 'Failed to create mailing list' }, { status: 500 })
    }

    const records = mapRowsToRecords(rows, mappedFields, list.id as string)

    let inserted = 0
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error: insertError } = await supabase.from('mailing_list_records').insert(batch)
      if (insertError) {
        // Roll back the orphan list so a failed upload leaves no empty list.
        await supabase.from('mailing_lists').delete().eq('id', list.id)
        console.error('upload-list: failed to insert records', insertError)
        return NextResponse.json({ error: 'Failed to persist uploaded records' }, { status: 500 })
      }
      inserted += batch.length
    }

    await supabase
      .from('mailing_lists')
      .update({ record_count: inserted, updated_at: new Date().toISOString() })
      .eq('id', list.id)

    return NextResponse.json({
      mailingListId: list.id as string,
      recordCount: inserted,
      name: listName,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('upload-list error:', err)
    return NextResponse.json({ error: 'Failed to persist uploaded list' }, { status: 500 })
  }
})
