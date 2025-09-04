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

export type DateRangeFilter = 
  | 'all-time'
  | 'today'
  | 'last-7-days'
  | 'last-30-days'
  | 'last-90-days'
  | 'this-month'
  | 'last-month'
  | 'this-year';

export type UsageFilter = 
  | 'all'
  | 'used'
  | 'unused'
  | 'recently-used';

export interface FilterState {
  dateRange: DateRangeFilter;
  tags: string[];
  usage: UsageFilter;
}

export function useListFilters({
  lists,
  records,
  viewMode,
  totalRecords,
}: UseListFiltersProps) {
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [quickFilter, setQuickFilter] = useState('all');
  const [filterState, setFilterState] = useState<FilterState>({
    dateRange: 'all-time',
    tags: [],
    usage: 'all',
  });
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

  // Helper function to get date range for filtering
  const getDateRangeFilter = useCallback((dateRange: DateRangeFilter): Date | null => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'last-7-days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'last-30-days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'last-90-days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'this-month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      case 'this-year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null;
    }
  }, []);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      quickFilter !== 'all' ||
      filterState.dateRange !== 'all-time' ||
      filterState.tags.length > 0 ||
      filterState.usage !== 'all' ||
      advancedSearchCriteria.columnFilters.length > 0 ||
      advancedSearchCriteria.tagFilter.tags.length > 0 ||
      advancedSearchCriteria.mailingHistoryFilter !== null ||
      advancedSearchCriteria.recordCountFilter !== null ||
      advancedSearchCriteria.listFilter !== null
    );
  }, [
    searchQuery,
    quickFilter,
    filterState,
    advancedSearchCriteria,
  ]);

  const listResults = useMemo(() => {
    if (viewMode !== 'lists') {
      return { items: [], total: 0 };
    }
    
    let filteredLists = [...(lists ?? [])];
    
    // Apply date range filter
    const dateFilter = getDateRangeFilter(filterState.dateRange);
    if (dateFilter) {
      filteredLists = filteredLists.filter(list => {
        const createdDate = new Date(list.created_at || '');
        return createdDate >= dateFilter;
      });
    }
    
    // Apply usage filter
    if (filterState.usage !== 'all') {
      filteredLists = filteredLists.filter(list => {
        // Check if list has been used (based on campaigns or other usage indicators)
        // For now, we'll consider a list "used" if it has any associated data
        // This can be enhanced when usage_count and last_used_at are added to the type
        const hasBeenUsed = false; // TODO: Add usage tracking to MailingList type
        const recentlyUsed = false; // TODO: Add last_used_at tracking
        
        switch (filterState.usage) {
          case 'used':
            return hasBeenUsed;
          case 'unused':
            return !hasBeenUsed;
          case 'recently-used':
            return recentlyUsed;
          default:
            return true;
        }
      });
    }
    
    // Map sort column names
    const sortColumnMap: Record<string, string> = {
      'name': 'name',
      'record_count': 'record_count',
      'created_at': 'created_at',
      'modified_at': 'modified_at',
      'created_by': 'created_by',
      'modified_by': 'modified_by'
    };
    
    const mappedSortColumn = sortColumnMap[sortBy] || sortBy;
    const isDescending = sortBy.endsWith('_desc');
    const cleanSortColumn = sortBy.replace('_desc', '');
    const finalSortColumn = sortColumnMap[cleanSortColumn] || cleanSortColumn;
    
    // Parse sortBy and determine direction
    const sortByObj = { 
      column: finalSortColumn,
      direction: isDescending ? 'desc' : sortDirection
    };
    
    // Merge additional filters into advanced criteria
    const mergedCriteria = {
      ...advancedSearchCriteria,
      tagFilter: {
        ...advancedSearchCriteria.tagFilter,
        tags: advancedSearchCriteria.tagFilter.tags.length 
          ? advancedSearchCriteria.tagFilter.tags 
          : filterState.tags,
      },
    };
    
    const result = filterSortPaginateLists(filteredLists, {
      criteria: mergedCriteria,
      searchQuery,
      sortBy: sortByObj,
      page: currentPage,
      pageSize: itemsPerPage,
      quickFilter: quickFilter as 'all' | 'last_7_days' | 'used_in_campaign',
    });
    
    return { items: result.items, totalCount: result.total };
  }, [
    viewMode,
    lists,
    searchQuery,
    sortBy,
    sortDirection,
    currentPage,
    itemsPerPage,
    quickFilter,
    filterState,
    advancedSearchCriteria,
    getDateRangeFilter,
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
    setFilterState({
      dateRange: 'all-time',
      tags: [],
      usage: 'all',
    });
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
  
  const handleFilter = useCallback((filterType: keyof FilterState, value: any) => {
    setFilterState(prev => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1);
  }, []);
  
  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'recent-unused':
        setFilterState({
          dateRange: 'last-30-days',
          tags: [],
          usage: 'unused',
        });
        break;
      case 'this-month-active':
        setFilterState({
          dateRange: 'this-month',
          tags: [],
          usage: 'used',
        });
        break;
      default:
        break;
    }
    setCurrentPage(1);
  }, []);

  const toggleAdvancedSearch = useCallback(() => {
    setAdvancedSearchOpen(!advancedSearchOpen);
  }, [advancedSearchOpen]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterState,
    advancedSearchOpen,
    setAdvancedSearchOpen,
    advancedSearchCriteria,
    setAdvancedSearchCriteria,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    
    // Computed
    filteredAndSortedLists: listResults.items,
    paginatedItems,
    totalPages,
    hasActiveFilters,
    
    // Handlers
    handleFilter,
    handleFilterChange: handleFilter,
    handleSort,
    handleSortChange: handleSort,
    clearFilters,
    handleQuickAction,
    toggleAdvancedSearch,
  };
}
