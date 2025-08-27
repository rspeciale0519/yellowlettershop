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

  // Cleanup effect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, [isMountedRef]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <ManagerHeader
        viewMode={viewMode}
        onViewModeChange={() =>
          setViewMode(viewMode === 'lists' ? 'records' : 'lists')
        }
        onAddClick={() =>
          viewMode === 'lists' ? setAddListOpen(true) : setAddRecordOpen(true)
        }
        isViewChangeDisabled={!selectedList && viewMode === 'records'}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        showAdvancedSearch={advancedSearchOpen}
        onToggleAdvancedSearch={() =>
          setAdvancedSearchOpen(!advancedSearchOpen)
        }
        sortBy={sortBy}
        onSortByChange={handleSort}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
      />

      {advancedSearchOpen && (
        <div className="mt-4 p-4 border rounded-md bg-muted/50">
          <AdvancedSearch
            criteria={advancedSearchCriteria}
            onCriteriaChange={setAdvancedSearchCriteria}
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
        onNameEdit={(id, name) => setEditingName({ id, value: name })}
        saveNameEdit={async () => {
          if (editingName) {
            await handleUpdateList(editingName.id, { name: editingName.value });
            setEditingName(null);
          }
        }}
        setEditingName={setEditingName}
        onOpenCSVImport={handleOpenCSVImport}
        onOpenDeduplication={handleOpenDeduplication}
        onOpenVersionHistory={handleOpenVersionHistory}
        onUpdateRecord={handleUpdateRecord}
        onAddTagToRecord={(recordId, tagId) => {
          /* Implement */
        }}
        onRemoveTagFromRecord={(recordId, tagId) => {
          /* Implement */
        }}
        onUpdateRecordStatus={(recordId, status) =>
          handleUpdateRecord(recordId, { status: status as any })
        }
        onRecordFieldEdit={(id, field, value) => {
          setEditingRecord({ id, field, value });
        }}
        editingRecord={editingRecord}
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
        onAdd={async () => {
          if (selectedList?.id) {
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
        }}
      />

      <EditListModal
        isOpen={editListId !== null}
        onClose={() => setEditListId(null)}
        listId={editListId}
        onUpdate={async () => {
          await mutateLists();
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            if (deleteType === 'list') {
              await deleteMailingList(deleteId);
              await mutateLists();
            } else {
              await deleteMailingListRecord(deleteId);
              if (selectedList?.id) {
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
            }
            setDeleteId(null);
          }
        }}
        itemName={
          deleteType === 'list'
            ? lists?.find((l) => l.id === deleteId)?.name ?? 'Unknown'
            : 'record'
        }
        itemType={deleteType}
      />

      <CSVImportModal
        isOpen={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        listId={selectedList?.id ?? ''}
        onImportComplete={async () => {
          await mutateLists();
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
        isList={false}
        recordCount={0}
      />
    </div>
  );
}