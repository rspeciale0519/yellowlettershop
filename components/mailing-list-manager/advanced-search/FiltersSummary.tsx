'use client';

import { Badge } from '@/components/ui/badge';
import { AdvancedSearchCriteria } from './types';

interface FiltersSummaryProps {
  criteria: AdvancedSearchCriteria;
}

export function FiltersSummary({ criteria }: FiltersSummaryProps) {
  const hasActiveFilters =
    criteria.columnFilters.length > 0 ||
    (criteria.listFilter?.listIds?.length ?? 0) > 0 ||
    (criteria.tagFilter?.tagIds?.length ?? 0) > 0 ||
    Boolean(criteria.mailingHistoryFilter) ||
    Boolean(criteria.recordCountFilter);
  return (
    <div className='mt-4 bg-muted/30 p-4 rounded-lg'>
      <h3 className='text-sm font-medium mb-2'>Active Filters:</h3>
      <div className='flex flex-wrap gap-2'>
        {criteria.columnFilters.length > 0 && (
          <Badge variant='secondary'>
            {criteria.columnFilters.length} column filter(s)
          </Badge>
        )}
        {criteria.listFilter && (
          <Badge variant='secondary'>
        {(criteria.tagFilter?.tagIds?.length ?? 0) > 0 && (
          <Badge variant="secondary">
            {criteria.tagFilter?.operator} {(criteria.tagFilter?.tagIds?.length ?? 0)} {pluralize((criteria.tagFilter?.tagIds?.length ?? 0), "tag")}
          </Badge>
        )}          <Badge variant='secondary'>
            {criteria.tagFilter.operator} {criteria.tagFilter.tagIds.length}{' '}
            tag(s)
          </Badge>
        )}
        {criteria.mailingHistoryFilter && (
          <Badge variant='secondary'>
            Mailing history: {criteria.mailingHistoryFilter.operator}
          </Badge>
        )}
        {criteria.recordCountFilter && (
          <Badge variant='secondary'>
            Record count: {criteria.recordCountFilter.operator}
          </Badge>
        )}
        {!hasActiveFilters && (
          <span className='text-muted-foreground text-sm'>
            No active filters
          </span>
        )}
      </div>
    </div>
  );
}
