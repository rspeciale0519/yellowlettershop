'use client';

import { useState, useCallback, useMemo } from 'react';
import type { AdvancedSearchCriteria } from '@/lib/mailing-lists-utils/types';
import { filterSortPaginateLists } from '@/lib/mailing-lists-utils';
import type { MailingList, MailingListRecord } from '@/types/supabase';
import { mapSupabaseRecords } from '@/lib/mappers/mailingListRecords';
import type { SupabaseMailingListRecord } from '@/types/mailing-records';

interface UseListFiltersProps {
  lists: MailingList[];
  records: MailingListRecord[];
  viewMode: 'lists' | 'records';
  totalRecords: number;
}

export function useListFilters({
  lists,
  records,
  viewMode,
  totalRecords,
}: UseListFiltersProps) {
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [quickFilter, setQuickFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] =
    useState<AdvancedSearchCriteria>({
      columnFilters: [],
      tagFilter: { tags: [], matchType: 'any' },
      mailingHistoryFilter: null,
      recordCountFilter: null,
      listFilter: null,
      logicalOperator: 'AND',
    });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      quickFilter !== 'all' ||
      tagFilters.length > 0 ||
      statusFilter !== 'all' ||
      advancedSearchCriteria.columnFilters.length > 0 ||
      advancedSearchCriteria.tagFilter.tags.length > 0 ||
      advancedSearchCriteria.mailingHistoryFilter !== null ||
      advancedSearchCriteria.recordCountFilter !== null ||
      advancedSearchCriteria.listFilter !== null
    );
  }, [
    searchQuery,
    quickFilter,
    tagFilters,
    statusFilter,
    advancedSearchCriteria,
  ]);

  const listResults = useMemo(() => {
    if (viewMode !== 'lists') {
      return { items: [], total: 0 };
    }
    
    // Parse sortBy string into object format
    const [column, direction] = sortBy.split('_');
    const sortByObj = { 
      column: column === 'name' ? 'name' : column === 'created' ? 'createdAt' : column, 
      direction: (direction as 'asc' | 'desc') || 'asc' 
    };
    
    // Merge additional filters into advanced criteria
    const mergedCriteria = {
      ...advancedSearchCriteria,
      // Merge tagFilters into tagFilter if not already present
      tagFilter: {
        ...advancedSearchCriteria.tagFilter,
        tags: advancedSearchCriteria.tagFilter.tags.length ? advancedSearchCriteria.tagFilter.tags : tagFilters,
      },
    };
    
    const result = filterSortPaginateLists(lists ?? [], {
      criteria: mergedCriteria,
      searchQuery,
      sortBy: sortByObj,
      page: currentPage,
      pageSize: itemsPerPage,
      quickFilter: quickFilter as 'all' | 'last_7_days' | 'used_in_campaign',
    });
    
    // Return with totalCount for backward compatibility
    return { items: result.items, totalCount: result.total };
  }, [
    viewMode,
    lists,
    searchQuery,
    sortBy,
    currentPage,
    itemsPerPage,
    quickFilter,
    tagFilters,
    statusFilter,
    advancedSearchCriteria,
  ]);
  const paginatedItems = useMemo(() => {
    return viewMode === 'lists'
      ? (listResults.items as (MailingList | MailingListRecord)[])
      : mapSupabaseRecords(records as unknown as SupabaseMailingListRecord[]);
  }, [viewMode, listResults.items, records]);

  const totalPages = useMemo(() => {
    const total = viewMode === 'lists' ? (listResults.totalCount ?? 0) : totalRecords;
    return Math.max(1, Math.ceil(total / itemsPerPage));
  }, [viewMode, listResults.totalCount, totalRecords, itemsPerPage]);

  // Event handlers
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setQuickFilter('all');
    setTagFilters([]);
    setStatusFilter('all');
    setAdvancedSearchCriteria({
      columnFilters: [],
      tagFilter: { tags: [], matchType: 'any' },
      mailingHistoryFilter: null,
      recordCountFilter: null,
      listFilter: null,
      logicalOperator: 'AND',
    });
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    quickFilter,
    setQuickFilter,
    tagFilters,
    setTagFilters,
    statusFilter,
    setStatusFilter,
    advancedSearchOpen,
    setAdvancedSearchOpen,
    advancedSearchCriteria,
    setAdvancedSearchCriteria,
    currentPage,
    setCurrentPage,
    itemsPerPage,

    // Computed values
    hasActiveFilters,
    listResults,
    paginatedItems,
    totalPages,

    // Event handlers
    clearFilters,
    handleSort,
  };
}
