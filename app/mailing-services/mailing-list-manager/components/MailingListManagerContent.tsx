'use client';

import type React from 'react';
import { useEffect } from 'react';
import { AddListModal } from '@/components/mailing-list-manager/add-list-modal';
import { AddRecordModal } from '@/components/mailing-list-manager/add-record-modal';
import { EditListModal } from '@/components/mailing-list-manager/edit-list-modal';
import { DeleteConfirmModal } from '@/components/mailing-list-manager/delete-confirm-modal';
import { CampaignUsageModal } from '@/components/mailing-list-manager/campaign-usage-modal';
import { CSVImportModal } from '@/components/mailing-list-manager/csv-import-modal';
import { DeduplicationModal } from '@/components/mailing-list-manager/deduplication-modal';
import { VersionHistoryModal } from '@/components/mailing-list-manager/version-history-modal';
import { AdvancedSearch } from '@/components/mailing-list-manager/page-components/advanced-search';
import { ManagerHeader } from '@/components/mailing-list-manager/page-components/manager-header';
import { FilterBar } from '@/components/mailing-list-manager/page-components/filter-bar';
import { Breadcrumbs } from '@/components/mailing-list-manager/page-components/breadcrumbs';
import { TableView } from '@/components/mailing-list-manager/page-components/table-view';
import { useMailingListManager } from '@/hooks/filters/useMailingListManager';
import { useListFilters } from '@/hooks/filters/use-mailing-list-manager/useListFilters';

export default function MailingListManagerContent() {
  const {
    // Data
    lists,
    tags,
    paginatedItems,

    // View state
    viewMode,
    setViewMode,
    selectedList,
    setSelectedList,

    // Search and filtering
    searchQuery,
    setSearchQuery,
    sortBy,
    quickFilter,
    setQuickFilter,
    advancedSearchOpen,
    setAdvancedSearchOpen,
    advancedSearchCriteria,
    setAdvancedSearchCriteria,
    hasActiveFilters,

    // Pagination
    currentPage,
    setCurrentPage,

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
    addTagToRecord,
    removeTagFromRecord,

    // Functions
    getMailingListRecords,
    deleteMailingList,
    deleteMailingListRecord,
    mutateLists,

    // Refs and utils
    isMountedRef,
    setRecords,
    setTotalRecords,
    itemsPerPage,
    statusFilter,
    tagFilters,
  } = useMailingListManager();

  // Enhanced filtering with new FilterState
  const enhancedFilters = useListFilters({
    lists: lists || [],
    records: [],
    viewMode,
    totalRecords: 0,
  });

  // Cleanup effect
  // Cleanup effect
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Helper function to refresh current list records
  const refreshCurrentListRecords = async () => {
    if (!selectedList?.id || !isMountedRef.current) return;
    
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
  };

  // Compute CampaignUsageModal subject context
  const campaignSubjectName = (campaignModalTitle || '').replace(/^Campaign Usage:\s*/, '');
  const subjectList = (lists || []).find((l) => l.name === campaignSubjectName);
  const isListSubject = viewMode === 'lists' || !!subjectList;
  const computedRecordCount = isListSubject
    ? (subjectList?.record_count ?? selectedList?.record_count ?? 0)
    : 0;

  return (
    <div className='p-4 md:p-6 lg:p-8 space-y-4'>
      <ManagerHeader
        viewMode={viewMode}
        onViewModeChange={() =>
          setViewMode(viewMode === 'lists' ? 'records' : 'lists')
        }
        onAddClick={() =>
          viewMode === 'lists' ? setAddListOpen(true) : setAddRecordOpen(true)
        }
        onUploadClick={() => setCsvImportOpen(true)}
        isViewChangeDisabled={false}
      />

      <FilterBar
        searchQuery={enhancedFilters.searchQuery}
        onSearchChange={enhancedFilters.setSearchQuery}
        onClearFilters={enhancedFilters.clearFilters}
        hasActiveFilters={enhancedFilters.hasActiveFilters}
        showAdvancedSearch={enhancedFilters.advancedSearchOpen}
        onToggleAdvancedSearch={enhancedFilters.toggleAdvancedSearch}
        sortBy={enhancedFilters.sortBy}
        onSortByChange={enhancedFilters.handleSortChange}
        filterState={enhancedFilters.filterState}
        onFilterChange={enhancedFilters.handleFilterChange}
        onQuickAction={enhancedFilters.handleQuickAction}
        availableTags={tags?.map(tag => ({ id: tag.id, name: tag.name })) || []}
      />

      {enhancedFilters.advancedSearchOpen && (
        <div className='mt-4 p-4 border rounded-md bg-muted/50'>
          <AdvancedSearch
            criteria={enhancedFilters.advancedSearchCriteria}
            onCriteriaChange={enhancedFilters.setAdvancedSearchCriteria}
            availableTags={tags || []}
            availableLists={lists || []}
          />
        </div>
      )}

      {viewMode === 'records' && (
        <Breadcrumbs
          selectedList={selectedList}
          onNavigateBack={() => {
            setViewMode('lists');
            setSelectedList(null);
          }}
        />
      )}

      {/* Content Area */}
      <TableView
        viewMode={viewMode}
        paginatedItems={paginatedItems}
        lists={lists || []}
        onViewRecords={(id) => {
          const list = lists?.find((l) => l.id === id);
          if (list) {
            setSelectedList(list);
            setViewMode('records');
            setCurrentPage(1);
          }
        }}
        onEditList={setEditListId}
        onDelete={openDeleteModal}
        onSort={handleSort}
        sortBy={sortBy}
        onAddTagToList={addTagToList}
        onRemoveTagFromList={removeTagFromList}
        availableTags={tags || []}
        onOpenCampaignModal={handleOpenCampaignModal}
        selectedRecords={selectedRecords}
        onCheckboxToggle={handleCheckboxToggle}
        selectAll={selectAll}
        onSelectAllChange={handleSelectAllChange}
        editingName={editingName}
        saveNameEdit={async () => {
          if (editingName) {
            try {
              await handleUpdateList(editingName.id, { name: editingName.value });
              setEditingName(null);
            } catch (error) {
              console.error('Failed to update list name:', error);
              // Consider showing a toast or error message to the user
            }
          }
        }}
        setEditingName={setEditingName}
        onOpenCSVImport={handleOpenCSVImport}
        onOpenDeduplication={handleOpenDeduplication}
        onOpenVersionHistory={handleOpenVersionHistory}
        onUpdateRecord={handleUpdateRecord}
        onUpdateRecordStatus={(recordId: string, status: string) =>
          handleUpdateRecord(recordId, { status: status as any })
        }
        onRecordFieldEdit={(id: string, field: string, value: any) => {
          setEditingRecord({ id, field, value });
        }}
        editingRecord={editingRecord}
        saveRecordFieldEdit={async () => {
          if (editingRecord) {
            try {
              await handleUpdateRecord(editingRecord.id, { [editingRecord.field]: editingRecord.value } as any);
            } finally {
              setEditingRecord(null);
            }
          }
        }}
        setEditingRecord={setEditingRecord}
      />

      {/* Modals */}
      <AddListModal
        isOpen={addListOpen}
        onClose={() => setAddListOpen(false)}
        onAdd={async (listData) => {
          await mutateLists();
        }}
      />

      <AddRecordModal
        isOpen={addRecordOpen}
        onClose={() => setAddRecordOpen(false)}
        listId={selectedList?.id ?? ''}
        onAdd={refreshCurrentListRecords}
      />

      <EditListModal
        isOpen={editListId !== null}
        onClose={() => setEditListId(null)}
        listId={editListId ?? ''}
        onUpdate={async () => {
          await mutateLists();
          if (viewMode === 'records') {
            await refreshCurrentListRecords();
          }
        }}
      />

      <DeleteConfirmModal
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={deleteType === 'list' ? 'Delete Mailing List' : 'Delete Record'}
        description={
          deleteType === 'list'
            ? 'Are you sure you want to delete this mailing list? This action cannot be undone.'
            : 'Are you sure you want to delete this record? This action cannot be undone.'
        }
        onConfirm={async () => {
          if (deleteId) {
            console.log(`Attempting to delete ${deleteType} with ID:`, deleteId);
            try {
              if (deleteType === 'list') {
                console.log('Calling deleteMailingList...');
                await deleteMailingList(deleteId);
                console.log('List deleted successfully, refreshing lists...');
                await mutateLists();
              } else {
                console.log('Calling deleteMailingListRecord...');
                await deleteMailingListRecord(deleteId);
                console.log('Record deleted successfully, refreshing all records...');
                console.log('Current viewMode:', viewMode);
                console.log('isMountedRef.current:', isMountedRef.current);
                
                // Refresh all records since we're showing records from all lists
                if (viewMode === 'records' && isMountedRef.current) {
                  console.log('About to fetch records with parameters:', {
                    limit: itemsPerPage || 50,
                    offset: ((currentPage || 1) - 1) * (itemsPerPage || 50),
                    search: searchQuery || '',
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    tags: tagFilters && tagFilters.length > 0 ? tagFilters : undefined,
                  });
                  
                  const result = await getMailingListRecords(undefined, {
                    limit: itemsPerPage || 50,
                    offset: ((currentPage || 1) - 1) * (itemsPerPage || 50),
                    search: searchQuery || '',
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    tags: tagFilters && tagFilters.length > 0 ? tagFilters : undefined,
                  });
                  
                  console.log('Fetch result:', result);
                  
                  if (isMountedRef.current) {
                    console.log('Setting records:', result.data?.length || 0, 'records');
                    setRecords(result.data || []);
                    setTotalRecords(result.count || 0);
                  }
                  console.log('Records refreshed successfully');
                } else {
                  console.log('Skipping record refresh - not in records view or component unmounted');
                }
              }
              setDeleteId(null);
            } catch (error) {
              console.error(`Failed to delete ${deleteType}:`, error);
              // Consider showing an error toast to the user
              setDeleteId(null);
            }
          }
        }}
        itemType={deleteType}
      />

      <CSVImportModal
        isOpen={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        listId={selectedList?.id ?? ''}
        listName={selectedList?.name ?? ''}
        onImportComplete={async () => {
          await mutateLists();
          if (viewMode === 'records') {
            await refreshCurrentListRecords();
          }
        }}
      />

      <DeduplicationModal
        isOpen={deduplicationOpen}
        onClose={() => setDeduplicationOpen(false)}
        listId={selectedList?.id ?? ''}
        listName={selectedList?.name ?? ''}
        recordCount={selectedList?.record_count ?? 0}
        onDeduplicationComplete={async (removed) => {
          await mutateLists();
          if (viewMode === 'records') {
            await refreshCurrentListRecords();
          }
        }}
      />

      <VersionHistoryModal
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        listId={selectedList?.id ?? ''}
        listName={selectedList?.name ?? ''}
        currentVersion={selectedList?.version ?? 1}
        onVersionRestore={async () => {
          await mutateLists();
        }}
      />

      <CampaignUsageModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        campaigns={selectedCampaigns}
        title={campaignModalTitle}
        isList={isListSubject}
        recordCount={computedRecordCount}
      />
    </div>
  );
}
