import type { MailingList as SBMailingList, Tag as SBTag, Campaign as SBCampaign } from '@/types/supabase'
import type {
  AdvancedSearchCriteria,
  MailingHistoryFilter,
  RecordCountFilter,
} from '@/types/advanced-search'

export type UICampaign = { id: string; orderId: string; mailedDate: string }
export type UITag = { id: string; name: string }
export type UIMailingList = {
  id: string
  name: string
  recordCount: number
  createdAt: string
  createdBy?: string
  modifiedDate?: string
  modifiedBy?: string
  tags: UITag[]
  campaigns: UICampaign[]
}

// --------- Mapping utilities ---------
function mapTags(raw: any[] | undefined): UITag[] {
  if (!raw || !Array.isArray(raw)) return []
  // Handle two shapes: [{ id, name, ... }] OR [{ tag: { id, name } }]
  return raw
    .map((t: any) => (t?.tag ? t.tag : t))
    .filter((t: any) => t && typeof t.id === 'string' && typeof t.name === 'string')
    .map((t: SBTag) => ({ id: t.id, name: t.name }))
}

function mapCampaigns(raw: any[] | undefined): UICampaign[] {
  if (!raw || !Array.isArray(raw)) return []
  return raw
    .map((c: any) => ({
      id: String(c.id ?? ''),
      orderId: String(c.active_order_id ?? c.order_id ?? c.vendor_order_id ?? c.id ?? ''),
      mailedDate: String(c.sent_at ?? c.completed_at ?? c.scheduled_at ?? c.created_at ?? ''),
    }))
    .filter((c) => !!c.id)
}

export function mapSupabaseListToUI(list: SBMailingList): UIMailingList {
  return {
    id: list.id,
    name: list.name,
    recordCount: list.record_count ?? 0,
    createdAt: list.created_at,
    createdBy: list.created_by,
    modifiedDate: list.modified_at,
    modifiedBy: list.modified_by,
    tags: mapTags((list as any).tags),
    campaigns: mapCampaigns((list as any).campaigns),
  }
}

export function mapSupabaseListsToUI(lists: SBMailingList[]): UIMailingList[] {
  return (lists || []).map(mapSupabaseListToUI)
}

// --------- Seeded RNG utilities ---------
function stableHash(str: string): number {
  // djb2
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  // Ensure positive 32-bit
  return hash >>> 0
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return function () {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function seededSample<T>(arr: T[], count: number, seedStr: string): T[] {
  const rng = mulberry32(stableHash(seedStr))
  const copy = [...arr]
  // Fisher-Yates using seeded RNG
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, Math.max(0, Math.min(count, copy.length)))
}

// --------- Filtering helpers (operate on raw snake_case lists) ---------
function getLastMailDate(list: SBMailingList): Date | null {
  const campaigns: any[] | undefined = (list as any).campaigns
  if (!campaigns || campaigns.length === 0) return null
  let latest: Date | null = null
  for (const c of campaigns) {
    const dateStr: string | undefined = c.sent_at || c.completed_at || c.scheduled_at || c.created_at
    if (!dateStr) continue
    const d = new Date(dateStr)
    if (!isNaN(d.getTime()) && (!latest || d > latest)) latest = d
  }
  return latest
}

function applyMailingHistory(list: SBMailingList, filter: MailingHistoryFilter): boolean {
  const lastMailDate = getLastMailDate(list)
  const now = new Date()
  switch (filter.type) {
    case 'not_mailed':
      return lastMailDate === null
    case 'in_last': {
      const days = filter.days ?? 0
      const threshold = new Date(now)
      threshold.setDate(threshold.getDate() - days)
      return !!lastMailDate && lastMailDate >= threshold
    }
    case 'more_than': {
      const days = filter.days ?? 0
      const threshold = new Date(now)
      threshold.setDate(threshold.getDate() - days)
      return !!lastMailDate && lastMailDate < threshold
    }
    case 'between_dates': {
      const start = filter.startDate ? new Date(filter.startDate) : null
      const end = filter.endDate ? new Date(filter.endDate) : null
      return !!lastMailDate && !!start && !!end && lastMailDate >= start && lastMailDate <= end
    }
    default:
      return true
  }
}

function applyRecordCountRange(list: SBMailingList, recordCountFilter: RecordCountFilter | null): boolean {
  if (!recordCountFilter || recordCountFilter.type !== 'range' || !recordCountFilter.range) return true
  const [a, b] = recordCountFilter.range
  const start = Math.min(a, b)
  const end = Math.max(a, b)
  const count = list.record_count ?? 0
  return count >= start && count <= end
}

function getTagIdsFromRaw(list: SBMailingList): string[] {
  const raw = (list as any).tags as any[] | undefined
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((t: any) => (t?.tag ? t.tag.id : t.id)).filter(Boolean)
}

function applyAdvancedBooleanFilters(list: SBMailingList, criteria: AdvancedSearchCriteria): boolean {
  const { columnFilters, tagFilter, listFilter, mailingHistoryFilter, recordCountFilter, logicalOperator } = criteria

  const columnBooleans = columnFilters.map((filter) => {
    const value = (list as any)[filter.column]
    if (value === undefined || value === null) return false
    const valueStr = String(value)
    const compare = filter.value
    switch (filter.operator) {
      case 'contains':
        return valueStr.toLowerCase().includes(compare.toLowerCase())
      case 'equals':
        return valueStr.toLowerCase() === compare.toLowerCase()
      case 'not_equals':
        return valueStr.toLowerCase() !== compare.toLowerCase()
      default:
        return false
    }
  })
  const columnGroup = columnBooleans.length === 0 ? true : logicalOperator === 'AND' ? columnBooleans.every(Boolean) : columnBooleans.some(Boolean)

  let tagGroup = true
  if (tagFilter && tagFilter.tags.length > 0) {
    const listTagIds = getTagIdsFromRaw(list)
    tagGroup = tagFilter.matchType === 'any' ? tagFilter.tags.some((id) => listTagIds.includes(id)) : tagFilter.tags.every((id) => listTagIds.includes(id))
  }

  let listSelectionGroup = true
  if (listFilter && listFilter.length > 0) listSelectionGroup = listFilter.includes(list.id)

  let mailingHistoryGroup = true
  if (mailingHistoryFilter) mailingHistoryGroup = applyMailingHistory(list, mailingHistoryFilter)

  const recordCountRangeGroup = applyRecordCountRange(list, recordCountFilter)

  const active: boolean[] = []
  if (columnFilters.length > 0) active.push(columnGroup)
  if (tagFilter && tagFilter.tags.length > 0) active.push(tagGroup)
  if (listFilter && listFilter.length > 0) active.push(listSelectionGroup)
  if (mailingHistoryFilter) active.push(mailingHistoryGroup)
  if (recordCountFilter && recordCountFilter.type === 'range' && recordCountFilter.range) active.push(recordCountRangeGroup)

  return active.length === 0 ? true : logicalOperator === 'AND' ? active.every(Boolean) : active.some(Boolean)
}

// --------- Public API ---------
export function filterSortPaginateLists(
  rawLists: SBMailingList[] | undefined,
  opts: {
    criteria: AdvancedSearchCriteria
    quickFilter?: 'all' | 'last_7_days' | 'used_in_campaign'
    searchQuery?: string
    sortBy?: { column: string; direction: 'asc' | 'desc' }
    page?: number
    pageSize?: number
    seed?: string
  }
): { items: UIMailingList[]; total: number } {
  const lists = [...(rawLists || [])]
  const quickFilter = opts.quickFilter ?? 'all'
  const searchQuery = (opts.searchQuery ?? '').trim().toLowerCase()
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.max(1, opts.pageSize ?? 10)
  const criteria = opts.criteria
  let appliedTop = false

  // 1. Quick filter
  let filtered = lists.filter((list) => {
    if (quickFilter === 'last_7_days') {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return new Date(list.created_at) >= sevenDaysAgo
    }
    if (quickFilter === 'used_in_campaign') {
      const campaigns: any[] | undefined = (list as any).campaigns
      return !!campaigns && campaigns.length > 0
    }
    return true
  })

  // 2. Search query (name)
  if (searchQuery) {
    filtered = filtered.filter((l) => l.name?.toLowerCase().includes(searchQuery))
  }

  // 3. Advanced boolean filters
  if (criteria) {
    filtered = filtered.filter((l) => applyAdvancedBooleanFilters(l, criteria))

    // 3b. Top/Random after boolean filters
    if (criteria.recordCountFilter && (criteria.recordCountFilter.type === 'top' || criteria.recordCountFilter.type === 'random')) {
      const count = Math.max(0, Number(criteria.recordCountFilter.count) || 0)
      if (count > 0) {
        if (criteria.recordCountFilter.type === 'top') {
          filtered = [...filtered].sort((a, b) => (b.record_count ?? 0) - (a.record_count ?? 0)).slice(0, count)
          appliedTop = true
        } else {
          const seed = opts.seed ?? JSON.stringify({ criteria, quickFilter, searchQuery })
          filtered = seededSample(filtered, count, seed)
        }
      } else {
        filtered = []
      }
    }
  }

  // 4. Map to UI shape BEFORE sorting and pagination
  const mapped = mapSupabaseListsToUI(filtered)

  // 5. Sorting by camelCase keys
  const effectiveSort = opts.sortBy ?? (appliedTop ? { column: 'recordCount', direction: 'desc' as const } : { column: 'createdAt', direction: 'desc' as const })
  const column = effectiveSort.column === 'created_at' ? 'createdAt' : effectiveSort.column // back-compat
  const direction = effectiveSort.direction

  const valueOf = (item: UIMailingList) => {
    switch (column) {
      case 'id':
      case 'name':
      case 'createdBy':
      case 'modifiedBy':
        return (item as any)[column] ?? ''
      case 'recordCount':
        return item.recordCount ?? 0
      case 'createdAt':
      case 'modifiedDate':
        return new Date((item as any)[column] ?? 0).getTime()
      default:
        return (item as any)[column]
    }
  }

  const sorted = [...mapped].sort((a, b) => {
    const av = valueOf(a)
    const bv = valueOf(b)
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return direction === 'asc' ? -1 : 1
    if (av > bv) return direction === 'asc' ? 1 : -1
    return 0
  })

  // 6. Pagination
  const total = sorted.length
  const start = (page - 1) * pageSize
  const items = sorted.slice(start, start + pageSize)
  return { items, total }
}
