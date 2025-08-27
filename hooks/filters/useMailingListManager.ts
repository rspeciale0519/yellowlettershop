'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLists } from '@/hooks/use-lists';
import { useMailingListFunctions } from '@/hooks/use-mailing-list-functions';
import { useTags } from '@/hooks/use-tags';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { MailingList, MailingListRecord } from '@/types/supabase';
import type { AdvancedSearchCriteria } from '@/types/advanced-search';
import { filterSortPaginateLists } from '@/lib/mailing-lists-utils';

export function useMailingListManager() {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isMountedRef = useRef(true);

  // Data fetching hooks
  const {
    lists,
    isLoading: listsLoading,
    error: listsError,
    mutate: mutateLists,
  } = useLists();
  const { tags, isLoading: tagsLoading, error: tagsError } = useTags();
  const {
    getMailingListRecords,
    createMailingList,
    updateMailingList,
    deleteMailingList,
    createMailingListRecord,
    updateMailingListRecord,
    deleteMailingListRecord,
  } = useMailingListFunctions();

  // View state
  const [viewMode, setViewMode] = useLocalStorage<'lists' | 'records'>('mailingListManagerView', 'lists');
  const [selectedList, setSelectedList] = useState<MailingList | null>(null);
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [quickFilter, setQuickFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<AdvancedSearchCriteria>({
    name: '',
    tags: [],
    dateRange: null,
    recordCountRange: null,
    status: null,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [records, setRecords] = useState<MailingListRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [addListOpen, setAddListOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'list' | 'record'>('list');
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [deduplicationOpen, setDeduplicationOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignModalTitle, setCampaignModalTitle] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<any[]>([]);

  // Selection state
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null);
  const [editingRecord, setEditingRecord] = useState<{ id: string; field: string; value: string } | null>(null);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || 
           quickFilter !== 'all' || 
           tagFilters.length > 0 || 
           statusFilter !== 'all' ||
           advancedSearchCriteria.name !== '' ||
           advancedSearchCriteria.tags?.length > 0 ||
           advancedSearchCriteria.dateRange !== null ||
           advancedSearchCriteria.recordCountRange !== null ||
           advancedSearchCriteria.status !== null;
  }, [searchQuery, quickFilter, tagFilters, statusFilter, advancedSearchCriteria]);

  const listResults = useMemo(() => {
    return filterSortPaginateLists(lists || [], {
      search: searchQuery,
      sortBy: sortBy as any,
      currentPage,
      itemsPerPage,
      quickFilter: quickFilter as any,
      tagFilters,
      statusFilter: statusFilter as any,
      advancedCriteria: advancedSearchCriteria,
    });
  }, [lists, searchQuery, sortBy, currentPage, itemsPerPage, quickFilter, tagFilters, statusFilter, advancedSearchCriteria]);

  const paginatedItems = useMemo(() => {
    return viewMode === 'lists' ? (listResults.items as (MailingList | MailingListRecord)[]) : records;
  }, [viewMode, listResults.items, records]);

  const totalPages = useMemo(() => {
    const total = viewMode === 'lists' ? listResults.totalCount : totalRecords;
    return Math.ceil(total / itemsPerPage);
  }, [viewMode, listResults.totalCount, totalRecords, itemsPerPage]);

  // Event handlers
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setQuickFilter('all');
    setTagFilters([]);
    setStatusFilter('all');
    setAdvancedSearchCriteria({
      name: '',
      tags: [],
      dateRange: null,
      recordCountRange: null,
      status: null,
    });
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  const openDeleteModal = useCallback((id: string, type: 'list' | 'record' = 'list') => {
    setDeleteId(id);
    setDeleteType(type);
  }, []);

  const handleCheckboxToggle = useCallback((recordId: string, checked: boolean) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(recordId);
      } else {
        newSet.delete(recordId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllChange = useCallback((checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRecords(new Set(records.map(record => record.id)));
    } else {
      setSelectedRecords(new Set());
    }
  }, [records]);

  const handleOpenCampaignModal = useCallback((campaigns: any[], title: string) => {
    setSelectedCampaigns(campaigns);
    setCampaignModalTitle(title);
    setCampaignModalOpen(true);
  }, []);

  const handleOpenCSVImport = useCallback(() => {
    setCsvImportOpen(true);
  }, []);

  const handleOpenDeduplication = useCallback(() => {
    setDeduplicationOpen(true);
  }, []);

  const handleOpenVersionHistory = useCallback(() => {
    setVersionHistoryOpen(true);
  }, []);

  // CRUD operations
  const handleUpdateList = useCallback(async (id: string, updates: Partial<MailingList>) => {
    try {
      await updateMailingList(id, updates);
      await mutateLists();
      toast({
        title: 'Success',
        description: 'List updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update list',
        variant: 'destructive',
      });
    }
  }, [updateMailingList, mutateLists, toast]);

  const handleUpdateRecord = useCallback(async (id: string, updates: Partial<MailingListRecord>) => {
    try {
      await updateMailingListRecord(id, updates);
      // Refresh records if in record view
      if (viewMode === 'records' && selectedList?.id) {
        const result = await getMailingListRecords(selectedList.id, {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          search: searchQuery,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          tags: tagFilters.length > 0 ? tagFilters : undefined,
        });
        if (isMountedRef.current) {
          setRecords(result.data || []);
          setTotalRecords(result.count || 0);
        }
      }
      toast({
        title: 'Success',
        description: 'Record updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update record',
        variant: 'destructive',
      });
    }
  }, [updateMailingListRecord, viewMode, selectedList, getMailingListRecords, itemsPerPage, currentPage, searchQuery, statusFilter, tagFilters, toast]);

  const addTagToList = useCallback(async (listId: string, tagId: string) => {
    // Implementation for adding tag to list
    console.log('Add tag to list:', listId, tagId);
  }, []);

  const removeTagFromList = useCallback(async (listId: string, tagId: string) => {
    // Implementation for removing tag from list
    console.log('Remove tag from list:', listId, tagId);
  }, []);

  return {
    // Data
    lists,
    tags,
    records,
    totalRecords,
    paginatedItems,
    totalPages,
    
    // Loading states
    listsLoading,
    tagsLoading,
    
    // Error states
    listsError,
    tagsError,
    
    // View state
    viewMode,
    setViewMode,
    selectedList,
    setSelectedList,
    isMobile,
    
    // Search and filtering
    searchQuery,
    setSearchQuery,
    sortBy,
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
    hasActiveFilters,
    
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    
    // Modal state
    addListOpen,
    setAddListOpen,
    addRecordOpen,
    setAddRecordOpen,
    editListId,
    setEditListId,
    deleteId,
    setDeleteId,
    deleteType,
    csvImportOpen,
    setCsvImportOpen,
    deduplicationOpen,
    setDeduplicationOpen,
    versionHistoryOpen,
    setVersionHistoryOpen,
    campaignModalOpen,
    setCampaignModalOpen,
    campaignModalTitle,
    selectedCampaigns,
    
    // Selection state
    selectedRecords,
    selectAll,
    editingName,
    setEditingName,
    editingRecord,
    setEditingRecord,
    
    // Event handlers
    clearFilters,
    handleSort,
    openDeleteModal,
    handleCheckboxToggle,
    handleSelectAllChange,
    handleOpenCampaignModal,
    handleOpenCSVImport,
    handleOpenDeduplication,
    handleOpenVersionHistory,
    
    // CRUD operations
    handleUpdateList,
    handleUpdateRecord,
    addTagToList,
    removeTagFromList,
    
    // Functions
    getMailingListRecords,
    createMailingList,
    updateMailingList,
    deleteMailingList,
    createMailingListRecord,
    updateMailingListRecord,
    deleteMailingListRecord,
    mutateLists,
    
    // Refs
    isMountedRef,
    
    // Utils
    setRecords,
    setTotalRecords,
    toast,
    router,
  };
}