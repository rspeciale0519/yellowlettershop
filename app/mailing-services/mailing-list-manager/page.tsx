"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, SortDesc, Plus, X, ChevronRight, FileText, Users, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useMediaQuery } from "@/hooks/use-media-query"
import { AddListModal } from "@/components/mailing-list-manager/add-list-modal"
import { AddRecordModal } from "@/components/mailing-list-manager/add-record-modal"
import { EditListModal } from "@/components/mailing-list-manager/edit-list-modal"
import { DeleteConfirmModal } from "@/components/mailing-list-manager/delete-confirm-modal"
import { MobileListCard } from "@/components/mailing-list-manager/mobile-list-card"
import { MobileRecordCard } from "@/components/mailing-list-manager/mobile-record-card"
import { useLists } from "@/hooks/use-lists"
import { useMailingListFunctions } from "@/hooks/use-mailing-list-functions"
import { MailingList, MailingListRecord } from "@/types/supabase"
import { useTags } from "@/hooks/use-tags"
import Link from "next/link"
import { PaginationControls } from "@/components/mailing-list-manager/pagination-controls"
import { MobilePaginationControls } from "@/components/mailing-list-manager/mobile-pagination-controls"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { CampaignUsageModal } from "@/components/mailing-list-manager/campaign-usage-modal"
import { ListsTable } from "@/components/mailing-list-manager/lists-table"
import { RecordsTable } from "@/components/mailing-list-manager/records-table"
import { AdvancedSearch, type AdvancedSearchCriteria } from "@/components/mailing-list-manager/advanced-search"
import { ManagerHeader } from "@/components/mailing-list-manager/page-components/manager-header"
import { FilterBar } from "@/components/mailing-list-manager/page-components/filter-bar"
import { Breadcrumbs } from "@/components/mailing-list-manager/page-components/breadcrumbs"
import { TableView } from "@/components/mailing-list-manager/page-components/table-view"

// Add custom styles for yellow hover effect
import "./mailing-list-manager.css"

// Custom Button component with yellow hover effect
const YellowHoverButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; className?: string }) => {
  return (
    <Button className={`yellow-hover-button ${className}`} {...props}>
      {children}
    </Button>
  )
}

export default function MailingListsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isMountedRef = useRef(true)

  // Data fetching hooks
  const { lists, isLoading: listsLoading, error: listsError, mutate: mutateLists } = useLists()
  const { tags, isLoading: tagsLoading, error: tagsError } = useTags()
  const {
    getMailingListRecords,
    createMailingList,
    updateMailingList,
    deleteMailingList,
    createMailingListRecord,
    updateMailingListRecord,
    deleteMailingListRecord,
    addTagToList,
    removeTagFromList,
  } = useMailingListFunctions()

  // View mode state
  const [viewMode, setViewMode] = useLocalStorage<"lists" | "records">("viewMode", "lists")
  const [selectedList, setSelectedList] = useState<MailingList | null>(null)

  // Records state
  const [records, setRecords] = useState<MailingListRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<Error | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)

  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<{ column: string; direction: "asc" | "desc" }>({ column: "created_at", direction: "desc" })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useLocalStorage("itemsPerPage", 10)
  const itemsPerPageOptions = [10, 25, 50, 100]

  // Modal states
  const [addListOpen, setAddListOpen] = useState(false)
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [editListId, setEditListId] = useState<string | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MailingList | MailingListRecord | null>(null)

  // Selection state
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Editing state
  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null)
  const [editingRecord, setEditingRecord] = useState<{ id: string; field: string; value: any } | null>(null);

  // Campaign Modal State
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [selectedCampaigns, setSelectedCampaigns] = useState<any[]>([])
  const [campaignModalTitle, setCampaignModalTitle] = useState("")

  // Advanced search state
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<AdvancedSearchCriteria>({
    columnFilters: [],
    tagFilter: null,
    mailingHistoryFilter: null,
    recordCountFilter: null,
    listFilter: null,
    logicalOperator: "AND",
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Fetch records when view mode changes or filters are applied
  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedList) return
      setRecordsLoading(true)
      try {
        const result = await getMailingListRecords(selectedList.id, {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          search: searchQuery,
          status: statusFilter !== "all" ? statusFilter : undefined,
          tags: tagFilters.length > 0 ? tagFilters : undefined,
        })
        if (isMountedRef.current) {
          setRecords(result.data || [])
          setTotalRecords(result.count || 0)
        }
      } catch (error) {
        if (isMountedRef.current) {
          setRecordsError(error as Error)
          toast({ title: "Error fetching records", description: (error as Error).message, variant: "destructive" })
        }
      } finally {
        if (isMountedRef.current) setRecordsLoading(false)
      }
    }

    if (viewMode === "records") {
      fetchRecords()
    }
  }, [viewMode, selectedList, currentPage, itemsPerPage, searchQuery, statusFilter, tagFilters, getMailingListRecords, toast])

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll)
    setSelectedRecords(selectAll ? [] : paginatedItems.map((item) => item.id))
  }

  const handleCheckboxToggle = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((recordId) => recordId !== id) : [...prev, id]
    )
  }

  const handleSort = (column: string) => {
    setSortBy((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "desc" ? "asc" : "desc",
    }))
  }

  const handleAddList = async (listName: string) => {
    try {
      const newList = await createMailingList({ name: listName })
      mutateLists()
      toast({ title: "List Created", description: `The list "${listName}" has been created.` })
      return newList
    } catch (error) {
      toast({ title: "Error Creating List", description: (error as Error).message, variant: "destructive" })
      throw error
    }
  }

  const handleUpdateList = async (listId: string, updates: Partial<MailingList>) => {
    try {
      const updatedList = await updateMailingList(listId, updates)
      mutateLists()
      toast({ title: "List Updated", description: `The list has been updated.` })
      return updatedList
    } catch (error) {
      toast({ title: "Error Updating List", description: (error as Error).message, variant: "destructive" })
    }
  }

  const openDeleteModal = (id: string, type: 'list' | 'record') => {
    let itemToSet: MailingList | MailingListRecord | undefined;
    if (type === 'list') {
      itemToSet = lists?.find(l => l.id === id);
    } else {
      itemToSet = records.find(r => r.id === id);
    }

    if (itemToSet) {
      setItemToDelete(itemToSet);
      setIsDeleteConfirmOpen(true);
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    try {
      if ("record_count" in itemToDelete) { // It's a MailingList
        await deleteMailingList(itemToDelete.id)
        mutateLists()
        toast({ title: "List Deleted", description: `The list "${itemToDelete.name}" has been deleted.` })
        if (selectedList?.id === itemToDelete.id) {
          setSelectedList(null)
          setViewMode("lists")
        }
      } else { // It's a MailingListRecord
        await deleteMailingListRecord(itemToDelete.id)
        // Refetch records
        const result = await getMailingListRecords(selectedList?.id, { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage })
        setRecords(result.data || [])
        setTotalRecords(result.count || 0)
        mutateLists() // To update record count
        toast({ title: "Record Deleted", description: `The record has been deleted.` })
      }
    } catch (error) {
      toast({ title: "Error Deleting Item", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const handleAddRecord = async (recordData: Partial<MailingListRecord>) => {
    if (!selectedList?.id) {
        toast({ title: "Error", description: "No list selected.", variant: "destructive" });
        return;
    }
    try {
      await createMailingListRecord({ ...recordData, mailing_list_id: selectedList.id })
      const result = await getMailingListRecords(selectedList?.id, { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage })
      setRecords(result.data || [])
      setTotalRecords(result.count || 0)
      mutateLists() // To update record count
      toast({ title: "Record Created", description: "The new record has been successfully created." })
    } catch (error) {
      toast({ title: "Error Creating Record", description: (error as Error).message, variant: "destructive" })
    }
  }

  const handleUpdateRecord = async (recordId: string, updates: Partial<MailingListRecord>) => {
    try {
      await updateMailingListRecord(recordId, updates)
      const result = await getMailingListRecords(selectedList?.id, { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage })
      setRecords(result.data || [])
      setTotalRecords(result.count || 0)
      toast({ title: "Record Updated", description: "The record has been updated." })
    } catch (error) {
      toast({ title: "Error Updating Record", description: (error as Error).message, variant: "destructive" })
    }
  }

  const filteredItems = useMemo(() => {
    let items = viewMode === 'lists' ? (lists || []) : records;
    // Apply search and filter logic here if needed, though backend handles most of it
    return items;
  }, [viewMode, lists, records, searchQuery, statusFilter, tagFilters]);

  const sortedItems = useMemo(() => {
    if (!filteredItems) return [];
    return [...filteredItems].filter(Boolean).sort((a, b) => {
      const aValue = a[sortBy.column as keyof typeof a];
      const bValue = b[sortBy.column as keyof typeof b];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (aValue < bValue) return sortBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortBy.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortBy]);

  const totalPages = Math.ceil((viewMode === 'lists' ? (lists?.length || 0) : totalRecords) / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const items = viewMode === 'lists' ? sortedItems : records; // Use server-side paginated records
    if (viewMode === 'lists') {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }
    return items; // Records are already paginated from the server
  }, [sortedItems, records, currentPage, itemsPerPage, viewMode]);

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTagFilters([])
    setAdvancedSearchCriteria({ columnFilters: [], tagFilter: null, mailingHistoryFilter: null, recordCountFilter: null, listFilter: null, logicalOperator: "AND" })
  }

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || tagFilters.length > 0;

  const handleOpenCampaignModal = (campaigns: any[], title: string) => {
    setSelectedCampaigns(campaigns)
    setCampaignModalTitle(title)
    setCampaignModalOpen(true)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <ManagerHeader
        viewMode={viewMode}
        onViewModeChange={() => setViewMode(viewMode === 'lists' ? 'records' : 'lists')}
        onAddClick={() => viewMode === 'lists' ? setAddListOpen(true) : setAddRecordOpen(true)}
        isViewChangeDisabled={!selectedList && viewMode === 'records'}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

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
          const list = lists?.find(l => l.id === id);
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
        onUpdateRecord={handleUpdateRecord}
        onAddTagToRecord={(recordId, tagId) => { /* Implement */ }}
        onRemoveTagFromRecord={(recordId, tagId) => { /* Implement */ }}
        onUpdateRecordStatus={(recordId, status) => handleUpdateRecord(recordId, { status: status as any })}
        onRecordFieldEdit={(id, field, value) => {
          setEditingRecord({ id, field, value });
        }}
        editingRecord={editingRecord}
        saveRecordFieldEdit={() => {
          if (editingRecord) {
            handleUpdateRecord(editingRecord.id, { [editingRecord.field]: editingRecord.value });
            setEditingRecord(null);
          }
        }}
        setEditingRecord={setEditingRecord}
      />
      
      {/* Pagination */}
      <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={viewMode === 'lists' ? (lists?.length || 0) : totalRecords}
          itemsPerPageOptions={itemsPerPageOptions}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(count) => {
            setItemsPerPage(count)
            setCurrentPage(1)
          }}
          itemLabel={viewMode}
        />

      {/* Modals */}
      <AddListModal
        open={addListOpen}
        onOpenChange={setAddListOpen}
        onSuccess={(newList) => {
          // The modal now returns the full list object, so we just need to mutate.
          mutateLists();
          toast({ title: "List Created", description: `The list "${newList.name}" has been created.` });
          setAddListOpen(false);
        }}
      />

      <AddRecordModal
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        onSuccess={async (recordData) => {
          await handleAddRecord(recordData)
          setAddRecordOpen(false)
        }}
        lists={lists}
        onCreateNewList={handleAddList}
      />

      <EditListModal
        open={!!editListId}
        onOpenChange={() => setEditListId(null)}
        listId={editListId}
        onSuccess={async (updatedList) => {
          await handleUpdateList(updatedList.id, updatedList)
          setEditListId(null)
        }}
      />

      <DeleteConfirmModal
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
        title={`Delete ${itemToDelete && 'record_count' in itemToDelete ? 'List' : 'Record'}`}
        description={`Are you sure you want to delete ${itemToDelete && 'name' in itemToDelete ? itemToDelete.name : `Record ${itemToDelete?.id}`}? This action cannot be undone.`}
      />

      <CampaignUsageModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        campaigns={selectedCampaigns}
        title={campaignModalTitle}
        isList={false} // Update this logic as needed
        recordCount={0} // Update this logic as needed
      />
    </div>
  )
}
