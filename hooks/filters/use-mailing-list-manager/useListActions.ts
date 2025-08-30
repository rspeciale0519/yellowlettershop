'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { MailingList, MailingListRecord } from '@/types/supabase';

interface UseListActionsProps {
  updateMailingList: (
    id: string,
    updates: Partial<MailingList>
  ) => Promise<void>;
  updateMailingListRecord: (
    id: string,
    updates: Partial<MailingListRecord>
  ) => Promise<void>;
  getMailingListRecords: (listId: string, options?: any) => Promise<any>;
  addTagToRecordAPI: (recordId: string, tagId: string) => Promise<void>;
  removeTagFromRecordAPI: (recordId: string, tagId: string) => Promise<void>;
  mutateLists: () => Promise<void>;
  viewMode: 'lists' | 'records';
  selectedList: MailingList | null;
  records: MailingListRecord[];
  setRecords: (records: MailingListRecord[]) => void;
  setTotalRecords: (total: number) => void;
  itemsPerPage: number;
  currentPage: number;
  searchQuery: string;
  statusFilter: string;
  tagFilters: string[];
  tags: any[];
  isMountedRef: React.MutableRefObject<boolean>;
}

export function useListActions({
  updateMailingList,
  updateMailingListRecord,
  getMailingListRecords,
  addTagToRecordAPI,
  removeTagFromRecordAPI,
  mutateLists,
  viewMode,
  selectedList,
  records,
  setRecords,
  setTotalRecords,
  itemsPerPage,
  currentPage,
  searchQuery,
  statusFilter,
  tagFilters,
  tags,
  isMountedRef,
}: UseListActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');

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
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [editingName, setEditingName] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [editingRecord, setEditingRecord] = useState<{
    id: string;
    field: string;
    value: string;
  } | null>(null);

  // Tag management for records
  const [pendingTagOperations, setPendingTagOperations] = useState<Set<string>>(
    new Set()
  );

  const openDeleteModal = useCallback(
    (id: string, type: 'list' | 'record' = 'list') => {
      setDeleteId(id);
      setDeleteType(type);
    },
    []
  );

  const handleCheckboxToggle = useCallback(
    (recordId: string, checked: boolean) => {
      setSelectedRecords((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(recordId);
        } else {
          newSet.delete(recordId);
        }
        return newSet;
      });
    },
    []
  );

  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      setSelectAll(checked);
      if (checked) {
        setSelectedRecords(new Set(records.map((record) => record.id)));
      } else {
        setSelectedRecords(new Set());
      }
    },
    [records]
  );

  const handleOpenCampaignModal = useCallback(
    (campaigns: Campaign[], title: string) => {
      setSelectedCampaigns(campaigns);
      setCampaignModalTitle(title);
      setCampaignModalOpen(true);
    },
    []
  );
  const handleOpenCSVImport = useCallback(() => {
    setCsvImportOpen(true);
  }, []);

  const handleOpenDeduplication = useCallback(() => {
    setDeduplicationOpen(true);
  }, []);

  const handleOpenVersionHistory = useCallback(() => {
    setVersionHistoryOpen(true);
  }, []);

  const handleUpdateList = useCallback(
    async (id: string, updates: Partial<MailingList>) => {
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
    },
    [updateMailingList, mutateLists, toast]
  );

  const handleUpdateRecord = useCallback(
    async (id: string, updates: Partial<MailingListRecord>) => {
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
  }, [
    currentPage,
    searchQuery,
    statusFilter,
    tagFilters,
    isMountedRef,
    setRecords,
    setTotalRecords,
    toast,
  ]);

  const addTagToList = useCallback(async (listId: string, tagId: string) => {
    console.log('Add tag to list:', listId, tagId);
  }, []);

  const removeTagFromList = useCallback(
    async (listId: string, tagId: string) => {
      console.log('Remove tag from list:', listId, tagId);
    },
    []
  );

  const addTagToRecord = useCallback(
    async (recordId: string, tagId: string) => {
      const operationKey = `${recordId}-${tagId}-add`;

      if (pendingTagOperations.has(operationKey)) return;

      // Add to pending operations
      setPendingTagOperations((prev) => new Set(prev).add(operationKey));

      // Optimistic update
      const previousRecords = records;
      setRecords(
        records.map((r) => {
          if (r.id === recordId) {
            const currentTags = r.tags || [];
            const tagExists = currentTags.some((t: any) => t.tag?.id === tagId);
            if (!tagExists) {
              // Find the tag object from the tags state
              const tagObj = tags.find((t) => t.id === tagId);
              if (tagObj) {
                return {
                  ...r,
                  tags: [...currentTags, { tag: tagObj }],
                };
              }
            }
          }
          return r;
        })
      );

      try {
        await addTagToRecordAPI(recordId, tagId);
        toast({
          title: 'Tag added successfully',
          description: 'The tag has been added to the record.',
        });
      } catch (error) {
        console.error('Failed to add tag to record:', error);
        // Revert optimistic update on error
        setRecords(previousRecords);
        toast({
          title: 'Error adding tag',
          description: 'Failed to add tag to record. Please try again.',
          variant: 'destructive',
        });
      } finally {
        // Remove from pending operations
        setPendingTagOperations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(operationKey);
          return newSet;
        });
      }
    },
    [records, tags, addTagToRecordAPI, toast, pendingTagOperations, setRecords]
  );

  const removeTagFromRecord = useCallback(
    async (recordId: string, tagId: string) => {
      const operationKey = `${recordId}-${tagId}-remove`;

      if (pendingTagOperations.has(operationKey)) return;

      // Add to pending operations
      setPendingTagOperations((prev) => new Set(prev).add(operationKey));

      // Optimistic update
      const previousRecords = records;
      setRecords(
        records.map((r) => {
          if (r.id === recordId) {
            const currentTags = r.tags || [];
            return {
              ...r,
              tags: currentTags.filter((t: any) => t.tag?.id !== tagId),
            };
          }
          return r;
        })
      );

      try {
        await removeTagFromRecordAPI(recordId, tagId);
        toast({
          title: 'Tag removed successfully',
          description: 'The tag has been removed from the record.',
        });
      } catch (error) {
        console.error('Failed to remove tag from record:', error);
        // Revert optimistic update on error
        setRecords(previousRecords);
        toast({
          title: 'Error removing tag',
          description: 'Failed to remove tag from record. Please try again.',
          variant: 'destructive',
        });
      } finally {
        // Remove from pending operations
        setPendingTagOperations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(operationKey);
          return newSet;
        });
      }
    },
    [records, removeTagFromRecordAPI, toast, pendingTagOperations, setRecords]
  );

  return {
    // State
    isMobile,

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

    // Utils
    toast,
    router,
  };
}
