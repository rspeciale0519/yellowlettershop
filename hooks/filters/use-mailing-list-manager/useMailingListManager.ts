'use client'

import { useListData } from './useListData'
import { useListFilters } from './useListFilters'
import { useListActions } from './useListActions'

export function useMailingListManager() {
  const listData = useListData()
  
  const listFilters = useListFilters({
    lists: listData.lists || [],
    records: listData.records,
    viewMode: listData.viewMode,
    totalRecords: listData.totalRecords,
  })

  const listActions = useListActions({
    updateMailingList: listData.updateMailingList,
    updateMailingListRecord: listData.updateMailingListRecord,
    getMailingListRecords: listData.getMailingListRecords,
    addTagToRecordAPI: listData.addTagToRecordAPI,
    removeTagFromRecordAPI: listData.removeTagFromRecordAPI,
    mutateLists: listData.mutateLists,
    viewMode: listData.viewMode,
    selectedList: listData.selectedList,
    records: listData.records,
    setRecords: listData.setRecords,
    setTotalRecords: listData.setTotalRecords,
    itemsPerPage: listFilters.itemsPerPage,
    currentPage: listFilters.currentPage,
    searchQuery: listFilters.searchQuery,
    statusFilter: listFilters.statusFilter,
    tagFilters: listFilters.tagFilters,
    tags: listData.tags || [],
    isMountedRef: listData.isMountedRef,
  })

  return {
    // Data
    lists: listData.lists,
    tags: listData.tags,
    records: listData.records,
    totalRecords: listData.totalRecords,
    paginatedItems: listFilters.paginatedItems,
    totalPages: listFilters.totalPages,

    // Loading states
    listsLoading: listData.listsLoading,
    tagsLoading: listData.tagsLoading,

    // Error states
    listsError: listData.listsError,
    tagsError: listData.tagsError,

    // View state
    viewMode: listData.viewMode,
    setViewMode: listData.setViewMode,
    selectedList: listData.selectedList,
    setSelectedList: listData.setSelectedList,
    isMobile: listActions.isMobile,

    // Search and filtering
    searchQuery: listFilters.searchQuery,
    setSearchQuery: listFilters.setSearchQuery,
    sortBy: listFilters.sortBy,
    setSortBy: listFilters.setSortBy,
    quickFilter: listFilters.quickFilter,
    setQuickFilter: listFilters.setQuickFilter,
    tagFilters: listFilters.tagFilters,
    setTagFilters: listFilters.setTagFilters,
    statusFilter: listFilters.statusFilter,
    setStatusFilter: listFilters.setStatusFilter,
    advancedSearchOpen: listFilters.advancedSearchOpen,
    setAdvancedSearchOpen: listFilters.setAdvancedSearchOpen,
    advancedSearchCriteria: listFilters.advancedSearchCriteria,
    setAdvancedSearchCriteria: listFilters.setAdvancedSearchCriteria,
    hasActiveFilters: listFilters.hasActiveFilters,

    // Pagination
    currentPage: listFilters.currentPage,
    setCurrentPage: listFilters.setCurrentPage,
    itemsPerPage: listFilters.itemsPerPage,

    // Modal state
    addListOpen: listActions.addListOpen,
    setAddListOpen: listActions.setAddListOpen,
    addRecordOpen: listActions.addRecordOpen,
    setAddRecordOpen: listActions.setAddRecordOpen,
    editListId: listActions.editListId,
    setEditListId: listActions.setEditListId,
    deleteId: listActions.deleteId,
    setDeleteId: listActions.setDeleteId,
    deleteType: listActions.deleteType,
    csvImportOpen: listActions.csvImportOpen,
    setCsvImportOpen: listActions.setCsvImportOpen,
    deduplicationOpen: listActions.deduplicationOpen,
    setDeduplicationOpen: listActions.setDeduplicationOpen,
    versionHistoryOpen: listActions.versionHistoryOpen,
    setVersionHistoryOpen: listActions.setVersionHistoryOpen,
    campaignModalOpen: listActions.campaignModalOpen,
    setCampaignModalOpen: listActions.setCampaignModalOpen,
    campaignModalTitle: listActions.campaignModalTitle,
    selectedCampaigns: listActions.selectedCampaigns,

    // Selection state
    selectedRecords: listActions.selectedRecords,
    selectAll: listActions.selectAll,
    editingName: listActions.editingName,
    setEditingName: listActions.setEditingName,
    editingRecord: listActions.editingRecord,
    setEditingRecord: listActions.setEditingRecord,

    // Event handlers
    clearFilters: listFilters.clearFilters,
    handleSort: listFilters.handleSort,
    openDeleteModal: listActions.openDeleteModal,
    handleCheckboxToggle: listActions.handleCheckboxToggle,
    handleSelectAllChange: listActions.handleSelectAllChange,
    handleOpenCampaignModal: listActions.handleOpenCampaignModal,
    handleOpenCSVImport: listActions.handleOpenCSVImport,
    handleOpenDeduplication: listActions.handleOpenDeduplication,
    handleOpenVersionHistory: listActions.handleOpenVersionHistory,

    // CRUD operations
    handleUpdateList: listActions.handleUpdateList,
    handleUpdateRecord: listActions.handleUpdateRecord,
    addTagToList: listActions.addTagToList,
    removeTagFromList: listActions.removeTagFromList,
    addTagToRecord: listActions.addTagToRecord,
    removeTagFromRecord: listActions.removeTagFromRecord,

    // Functions
    getMailingListRecords: listData.getMailingListRecords,
    createMailingList: listData.createMailingList,
    updateMailingList: listData.updateMailingList,
    deleteMailingList: listData.deleteMailingList,
    createMailingListRecord: listData.createMailingListRecord,
    updateMailingListRecord: listData.updateMailingListRecord,
    deleteMailingListRecord: listData.deleteMailingListRecord,
    mutateLists: listData.mutateLists,

    // Refs
    isMountedRef: listData.isMountedRef,

    // Utils
    setRecords: listData.setRecords,
    setTotalRecords: listData.setTotalRecords,
    toast: listActions.toast,
    router: listActions.router,
  }
}