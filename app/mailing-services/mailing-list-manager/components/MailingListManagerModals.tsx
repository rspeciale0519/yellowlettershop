'use client';

import type React from 'react';
import { AddListModal } from '@/components/mailing-list-manager/add-list-modal';
import { AddRecordModal } from '@/components/mailing-list-manager/add-record-modal';
import { EditListModal } from '@/components/mailing-list-manager/edit-list-modal';
import { DeleteConfirmModal } from '@/components/mailing-list-manager/delete-confirm-modal';
import { CampaignUsageModal } from '@/components/mailing-list-manager/campaign-usage-modal';
import { CSVImportModal } from '@/components/mailing-list-manager/csv-import-modal';
import { DeduplicationModal } from '@/components/mailing-list-manager/deduplication-modal';
import { VersionHistoryModal } from '@/components/mailing-list-manager/version-history-modal';

interface MailingListManagerModalsProps {
  // Modal states
  addListOpen: boolean;
  setAddListOpen: (open: boolean) => void;
  addRecordOpen: boolean;
  setAddRecordOpen: (open: boolean) => void;
  editListId: string | null;
  setEditListId: (id: string | null) => void;
  deleteId: string | null;
  setDeleteId: (id: string | null) => void;
  deleteType: 'list' | 'record';
  csvImportOpen: boolean;
  setCsvImportOpen: (open: boolean) => void;
  deduplicationOpen: boolean;
  setDeduplicationOpen: (open: boolean) => void;
  versionHistoryOpen: boolean;
  setVersionHistoryOpen: (open: boolean) => void;
  campaignModalOpen: boolean;
  setCampaignModalOpen: (open: boolean) => void;
  
  // Data
  selectedList: any;
  campaignModalTitle: string;
  selectedCampaigns: any[];
  viewMode: 'lists' | 'records';
  lists: any[];
  
  // Handlers
  mutateLists: () => Promise<void>;
  refreshCurrentListRecords: () => Promise<void>;
  deleteMailingList: (id: string) => Promise<void>;
  deleteMailingListRecord: (id: string) => Promise<void>;
  getMailingListRecords: (listId: string, params: any) => Promise<any>;
  
  // Additional props for delete modal
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  statusFilter: string;
  tagFilters: string[];
  setRecords: (records: any[]) => void;
  setTotalRecords: (count: number) => void;
  isMountedRef: React.MutableRefObject<boolean>;
}

export function MailingListManagerModals({
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
  selectedList,
  campaignModalTitle,
  selectedCampaigns,
  viewMode,
  lists,
  mutateLists,
  refreshCurrentListRecords,
  deleteMailingList,
  deleteMailingListRecord,
  getMailingListRecords,
  currentPage,
  itemsPerPage,
  searchQuery,
  statusFilter,
  tagFilters,
  setRecords,
  setTotalRecords,
  isMountedRef,
}: MailingListManagerModalsProps) {
  // Compute CampaignUsageModal subject context
  const campaignSubjectName = (campaignModalTitle || '').replace(/^Campaign Usage:\s*/, '');
  const subjectList = (lists || []).find((l) => l.name === campaignSubjectName);
  const isListSubject = viewMode === 'lists' || !!subjectList;
  const computedRecordCount = isListSubject
    ? (subjectList?.record_count ?? selectedList?.record_count ?? 0)
    : 0;

  return (
    <>
      <AddListModal
        isOpen={addListOpen}
        onClose={() => setAddListOpen(false)}
        onAdd={async () => {
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
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            try {
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
            } catch (error) {
              console.error(`Failed to delete ${deleteType}:`, error);
              setDeleteId(null);
            }
          }
        }}
        itemType={deleteType}
      />

      <CSVImportModal
        isOpen={csvImportOpen}
        onClose={() => setCsvImportOpen(false)}
        listId={selectedList?.id ?? null}
        listName={selectedList?.name ?? null}
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
        onDeduplicationComplete={async () => {
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
    </>
  );
}
