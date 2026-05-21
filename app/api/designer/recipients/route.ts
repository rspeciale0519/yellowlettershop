import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import {
  mapRowToRecipientDTO,
  parseRecipientsQuery,
} from '@/components/designer/preview/recipient-dto'

// Thin, server-only recipient access for the designer preview.
//
// Isolation: this route (App-API, excluded from typecheck:ui) is the ONLY
// path the designer uses to read mailing data — typechecked client code
// imports the pure `recipient-dto` module, never the broken
// `lib/supabase/mailing-lists` / `@/types/supabase` chain. The service client
// bypasses RLS, so every query is explicitly scoped to the authed user.
//
//   GET /api/designer/recipients?kind=lists
//   GET /api/designer/recipients?kind=records&listId=<id>&search=<q>&limit&offset
//
// Auth: Authorization: Bearer <supabase access token> (see withAuth).

function sanitizeSearch(value: string): string {
  return value.replace(/[%,()]/g, ' ').trim()
}

export const GET = withAuth(
  async (request: NextRequest, { userId }: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const query = parseRecipientsQuery(request.nextUrl.searchParams)
      const supabase = createClient()

      if (query.kind === 'lists') {
        const { data, error } = await supabase
          .from('mailing_lists')
          .select('*')
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        const lists = (data ?? []).map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ''),
          name:
            typeof row.name === 'string' && row.name.trim() ? row.name : 'Untitled list',
          recordCount:
            typeof row.record_count === 'number' ? row.record_count : undefined,
        }))
        return NextResponse.json({ lists })
      }

      if (!query.listId) {
        return NextResponse.json(
          { error: 'listId is required for records' },
          { status: 400 },
        )
      }

      // Defense-in-depth: the service client bypasses RLS, so confirm the
      // list belongs to this user before exposing its records.
      const { data: listRow, error: listError } = await supabase
        .from('mailing_lists')
        .select('id')
        .eq('id', query.listId)
        .eq('created_by', userId)
        .maybeSingle()
      if (listError) throw listError
      if (!listRow) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 })
      }

      let recordsQuery = supabase
        .from('mailing_list_records')
        .select('*', { count: 'exact' })
        .eq('mailing_list_id', query.listId)

      if (query.search) {
        const s = sanitizeSearch(query.search)
        if (s) {
          recordsQuery = recordsQuery.or(
            `first_name.ilike.%${s}%,last_name.ilike.%${s}%,address_line1.ilike.%${s}%`,
          )
        }
      }

      const { data, error, count } = await recordsQuery
        .order('created_at', { ascending: false })
        .range(query.offset, query.offset + query.limit - 1)
      if (error) throw error

      const records = (data ?? []).map((row) =>
        mapRowToRecipientDTO(row as Record<string, unknown>),
      )
      return NextResponse.json({ records, count: count ?? records.length })
    } catch (error) {
      console.error('Recipients route error:', error)
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to load recipients',
        },
        { status: 500 },
      )
    }
  },
)
