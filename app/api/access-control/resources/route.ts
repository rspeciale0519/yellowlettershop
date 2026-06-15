import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const RESOURCE_TYPES = ['mailing_list', 'template', 'design', 'contact_card', 'asset'] as const
type ResourceType = (typeof RESOURCE_TYPES)[number]

interface ResourceSource {
  table: string
  labelColumn: string
  teamColumn: string | null
  metaColumn: string | null
  activeFilter: { column: string; value: boolean } | null
}

// Server-side allowlist ONLY. The client supplies a validated `type` KEY; table and
// column names are never taken from request input (prevents identifier injection).
const RESOURCE_SOURCES: Record<ResourceType, ResourceSource> = {
  mailing_list: { table: 'mailing_lists', labelColumn: 'name', teamColumn: 'team_id', metaColumn: 'record_count', activeFilter: { column: 'is_active', value: true } },
  design: { table: 'saved_designs', labelColumn: 'name', teamColumn: 'team_id', metaColumn: 'design_type', activeFilter: null },
  contact_card: { table: 'contact_cards', labelColumn: 'name', teamColumn: 'team_id', metaColumn: 'company', activeFilter: { column: 'is_soft_deleted', value: false } },
  asset: { table: 'user_assets', labelColumn: 'original_filename', teamColumn: 'team_id', metaColumn: 'file_type', activeFilter: null },
  template: { table: 'design_templates', labelColumn: 'name', teamColumn: null, metaColumn: 'category', activeFilter: { column: 'is_active', value: true } }
}

const querySchema = z.object({
  type: z.enum(RESOURCE_TYPES),
  team_id: z.string().uuid(),
  q: z.string().trim().max(100).optional(),
  ids: z.string().max(4000).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
})

function formatMeta(type: ResourceType, value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (type === 'mailing_list') return `${value} records`
  return String(value)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      type: searchParams.get('type') ?? undefined,
      team_id: searchParams.get('team_id') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      ids: searchParams.get('ids') ?? undefined,
      limit: searchParams.get('limit') ?? undefined
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }
    const { type, team_id, q, ids, limit } = parsed.data

    // Explicit team-admin guard: blocks enumerating another team's resources even
    // where the caller happens to own some rows in it.
    const { data: isAdmin, error: guardError } = await supabase.rpc('is_team_admin', { p_team_id: team_id })
    if (guardError) throw guardError
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const src = RESOURCE_SOURCES[type]
    const columns = ['id', src.labelColumn, src.metaColumn].filter(Boolean).join(', ')
    let query = supabase.from(src.table).select(columns)

    if (src.teamColumn) query = query.eq(src.teamColumn, team_id)
    if (src.activeFilter) query = query.eq(src.activeFilter.column, src.activeFilter.value)

    if (ids) {
      const idList = ids.split(',').map(s => s.trim()).filter(Boolean).slice(0, 200)
      query = query.in('id', idList)
    } else if (q) {
      query = query.ilike(src.labelColumn, `%${q}%`)
    }

    const { data, error } = await query.order(src.labelColumn, { ascending: true }).limit(limit)
    if (error) throw error

    const resources = ((data ?? []) as Record<string, unknown>[]).map(row => ({
      id: row.id as string,
      label: (row[src.labelColumn] as string) || '(untitled)',
      meta: src.metaColumn ? formatMeta(type, row[src.metaColumn]) : undefined
    }))

    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error listing access-control resources:', error)
    return NextResponse.json({ error: 'Failed to list resources' }, { status: 500 })
  }
}
