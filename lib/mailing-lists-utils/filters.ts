import type {
  AdvancedSearchCriteria,
  MailingHistoryFilter,
  RecordCountFilter,
  SupabaseListWithJoins,
  TagInput,
} from './types';

// --------- Filtering helpers (operate on raw snake_case lists) ---------
function getLastMailDate(list: SupabaseListWithJoins): Date | null {
  const campaigns = list.campaigns;
  if (!campaigns || campaigns.length === 0) return null;
  let latest: Date | null = null;
  for (const c of campaigns) {
    const dateStr: string | undefined =
      c.sent_at || c.completed_at || c.scheduled_at || c.created_at;
    if (!dateStr) continue;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && (!latest || d > latest)) latest = d;
  }
  return latest;
}

function applyMailingHistory(
  list: SupabaseListWithJoins,
  filter: MailingHistoryFilter
): boolean {
  const lastMailDate = getLastMailDate(list);
  const now = new Date();
  switch (filter.type) {
    case 'not_mailed':
      return lastMailDate === null;
    case 'in_last': {
      const days = filter.days ?? 0;
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - days);
      return !!lastMailDate && lastMailDate >= threshold;
    }
    case 'more_than': {
      const days = filter.days ?? 0;
      const threshold = new Date(now);
      threshold.setDate(threshold.getDate() - days);
      return !!lastMailDate && lastMailDate < threshold;
    }
    case 'between_dates': {
      const start = filter.startDate ? new Date(filter.startDate) : null;
      const end = filter.endDate ? new Date(filter.endDate) : null;
      return (
        !!lastMailDate &&
        !!start &&
        !!end &&
        lastMailDate >= start &&
        lastMailDate <= end
      );
    }
    default:
      return true;
  }
}

function applyRecordCountRange(
  list: SupabaseListWithJoins,
  recordCountFilter: RecordCountFilter | null
): boolean {
  if (
    !recordCountFilter ||
    recordCountFilter.type !== 'range' ||
    !recordCountFilter.range
  )
    return true;
  const [a, b] = recordCountFilter.range;
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  const count = list.record_count ?? 0;
  return count >= start && count <= end;
}

function getTagIdsFromRaw(list: SupabaseListWithJoins): string[] {
  const raw = list.tags;
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((t: TagInput) => {
      if ('tag' in t && t.tag && typeof t.tag === 'object' && 'id' in t.tag) {
        return String(t.tag.id);
      }
      return String(t.id);
    })
    .filter(Boolean);
}

export function applyAdvancedBooleanFilters(
  list: SupabaseListWithJoins,
  criteria: AdvancedSearchCriteria
): boolean {
  const {
    columnFilters,
    tagFilter,
    listFilter,
    mailingHistoryFilter,
    recordCountFilter,
    logicalOperator,
  } = criteria;

  const columnBooleans = columnFilters.map((filter) => {
    const value = (list as Record<string, unknown>)[filter.column];
    if (value === undefined || value === null) return false;
    const valueStr = String(value);
    const compare = filter.value;
    switch (filter.operator) {
      case 'contains':
        return valueStr.toLowerCase().includes(compare.toLowerCase());
      case 'equals':
        return valueStr.toLowerCase() === compare.toLowerCase();
      case 'not_equals':
        return valueStr.toLowerCase() !== compare.toLowerCase();
      default:
        return false;
    }
  });
  const columnGroup =
    columnBooleans.length === 0
      ? true
      : logicalOperator === 'AND'
      ? columnBooleans.every(Boolean)
      : columnBooleans.some(Boolean);

  let tagGroup = true;
  if (tagFilter && tagFilter.tags.length > 0) {
    const listTagIds = getTagIdsFromRaw(list);
    tagGroup =
      tagFilter.matchType === 'any'
        ? tagFilter.tags.some((id) => listTagIds.includes(id))
        : tagFilter.tags.every((id) => listTagIds.includes(id));
  }

  let listSelectionGroup = true;
  if (listFilter && listFilter.length > 0)
    listSelectionGroup = listFilter.includes(list.id);

  let mailingHistoryGroup = true;
  if (mailingHistoryFilter)
    mailingHistoryGroup = applyMailingHistory(list, mailingHistoryFilter);

  const recordCountRangeGroup = applyRecordCountRange(list, recordCountFilter);

  const active: boolean[] = [];
  if (columnFilters.length > 0) active.push(columnGroup);
  if (tagFilter && tagFilter.tags.length > 0) active.push(tagGroup);
  if (listFilter && listFilter.length > 0) active.push(listSelectionGroup);
  if (mailingHistoryFilter) active.push(mailingHistoryGroup);
  if (
    recordCountFilter &&
    recordCountFilter.type === 'range' &&
    recordCountFilter.range
  )
    active.push(recordCountRangeGroup);

  return active.length === 0
    ? true
    : logicalOperator === 'AND'
    ? active.every(Boolean)
    : active.some(Boolean);
}
