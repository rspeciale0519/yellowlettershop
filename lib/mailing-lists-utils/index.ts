import type {
  AdvancedSearchCriteria,
  UIMailingList,
  SupabaseListWithJoins,
} from './types';
import { mapSupabaseListsToUI } from './mappers';
import { applyAdvancedBooleanFilters } from './filters';
import { seededSample } from './utils';

// --------- Public API ---------
export function filterSortPaginateLists(
  rawLists: SupabaseListWithJoins[] | undefined,
  opts: {
    criteria: AdvancedSearchCriteria;
    quickFilter?: 'all' | 'last_7_days' | 'used_in_campaign';
    searchQuery?: string;
    sortBy?: { column: string; direction: 'asc' | 'desc' };
    page?: number;
    pageSize?: number;
    seed?: string;
  }
): { items: UIMailingList[]; total: number } {
  const lists = [...(rawLists || [])];
  const quickFilter = opts.quickFilter ?? 'all';
  const searchQuery = (opts.searchQuery ?? '').trim().toLowerCase();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, opts.pageSize ?? 10);
  const criteria = opts.criteria;
  let appliedTop = false;

  // 1. Quick filter
  let filtered = lists.filter((list) => {
    if (quickFilter === 'last_7_days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(list.created_at) >= sevenDaysAgo;
    }
    if (quickFilter === 'used_in_campaign') {
      const campaigns = list.campaigns;
      return Array.isArray(campaigns) && campaigns.length > 0;
    }
    return true;
  });

  // 2. Search query (name)
  if (searchQuery) {
    filtered = filtered.filter((l) =>
      l.name?.toLowerCase().includes(searchQuery)
    );
  }

  // 3. Advanced boolean filters
  if (criteria) {
    filtered = filtered.filter((l) => applyAdvancedBooleanFilters(l, criteria));

    // 3b. Top/Random after boolean filters
    if (
      criteria.recordCountFilter &&
      (criteria.recordCountFilter.type === 'top' ||
        criteria.recordCountFilter.type === 'random')
    ) {
      const count = Math.max(0, Number(criteria.recordCountFilter.count) || 0);
      if (count > 0) {
        if (criteria.recordCountFilter.type === 'top') {
          filtered = [...filtered]
            .sort((a, b) => (b.record_count ?? 0) - (a.record_count ?? 0))
            .slice(0, count);
          appliedTop = true;
        } else {
          const seed =
            opts.seed ?? JSON.stringify({ criteria, quickFilter, searchQuery });
          filtered = seededSample(filtered, count, seed);
        }
      } else {
        filtered = [];
      }
    }
  }

  // 4. Map to UI shape BEFORE sorting and pagination
  const mapped = mapSupabaseListsToUI(filtered);

  // 5. Sorting by camelCase keys
  const effectiveSort =
    opts.sortBy ??
    (appliedTop
      ? { column: 'recordCount', direction: 'desc' as const }
      : { column: 'createdAt', direction: 'desc' as const });
  const column =
    effectiveSort.column === 'created_at' ? 'createdAt' : effectiveSort.column; // back-compat
  const direction = effectiveSort.direction;

  const valueOf = (item: UIMailingList) => {
    switch (column) {
      case 'id':
      case 'name':
      case 'createdBy':
      case 'modifiedBy':
        return (item as any)[column] ?? '';
      case 'recordCount':
        return item.recordCount ?? 0;
      case 'createdAt':
      case 'modifiedDate':
        return new Date((item as any)[column] ?? 0).getTime();
      default:
        return (item as any)[column];
    }
  };

  const sorted = [...mapped].sort((a, b) => {
    const av = valueOf(a);
    const bv = valueOf(b);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // 6. Pagination
  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  return { items, total };
}

// Re-export types and utilities for external use
export type {
  UIMailingList,
  UICampaign,
  UITag,
  AdvancedSearchCriteria,
  MailingHistoryFilter,
  RecordCountFilter,
} from './types';

export { mapSupabaseListToUI, mapSupabaseListsToUI } from './mappers';
