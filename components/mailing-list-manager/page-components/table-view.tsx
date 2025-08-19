"use client"

import { ListsTable } from "@/components/mailing-list-manager/lists-table"
import { RecordsTable } from "@/components/mailing-list-manager/records-table"
import { MailingList, MailingListRecord } from "@/types/supabase"

interface TableViewProps {
  viewMode: "lists" | "records"
  paginatedItems: any[]
  lists: MailingList[]
  // ListsTable props
  onViewRecords: (id: string) => void
  onEditList: (id: string) => void
  onDelete: (id: string, type: 'list' | 'record') => void
  onSort: (column: string) => void
  sortBy: { column: string; direction: "asc" | "desc" }
  onAddTagToList: (listId: string, tagId: string) => void
  onRemoveTagFromList: (listId: string, tagId: string) => void
  availableTags: { id: string; name: string }[]
  onOpenCampaignModal: (campaigns: any[], title: string) => void
  selectedRecords: string[]
  onCheckboxToggle: (id: string) => void
  selectAll: boolean
  onSelectAllChange: (checked: boolean | "indeterminate") => void
  editingName: { id: string; value: string } | null
  onNameEdit: (id: string, name: string) => void
  saveNameEdit: () => void
  setEditingName: (value: { id: string; value: string } | null) => void
  // Modal open handlers
  onOpenCSVImport: (id: string) => void
  onOpenDeduplication: (id: string) => void
  onOpenVersionHistory: (id: string) => void
  // RecordsTable props
  onUpdateRecord: (recordId: string, updates: Partial<MailingListRecord>) => void
  onAddTagToRecord: (recordId: string, tagId: string) => void
  onRemoveTagFromRecord: (recordId: string, tagId: string) => void
  onUpdateRecordStatus: (recordId: string, status: string) => void
  onRecordFieldEdit: (id: string, field: string, value: any) => void
  editingRecord: { id: string; field: string; value: any } | null
  saveRecordFieldEdit: () => void
  setEditingRecord: (value: { id: string; field: string; value: any } | null) => void
}

export const TableView = (props: TableViewProps) => {
  return (
    <div className="rounded-md border overflow-hidden">
      {props.viewMode === 'lists' ? (
        <ListsTable
          lists={props.paginatedItems as MailingList[]}
          onViewRecords={props.onViewRecords}
          onEdit={props.onEditList}
          onDelete={(id) => props.onDelete(id, 'list')}
          onSort={props.onSort}
          sortBy={props.sortBy}
          onAddTag={props.onAddTagToList}
          onRemoveTag={props.onRemoveTagFromList}
          availableTags={props.availableTags}
          onOpenCampaignModal={props.onOpenCampaignModal}
          selectedRecords={props.selectedRecords}
          onCheckboxToggle={props.onCheckboxToggle}
          selectAll={props.selectAll}
          onSelectAllChange={props.onSelectAllChange}
          editingName={props.editingName}
          onNameEdit={props.onNameEdit}
          saveNameEdit={props.saveNameEdit}
          setEditingName={props.setEditingName}
          onOpenCSVImport={props.onOpenCSVImport}
          onOpenDeduplication={props.onOpenDeduplication}
          onOpenVersionHistory={props.onOpenVersionHistory}
        />
      ) : (
        <RecordsTable
          records={props.paginatedItems as MailingListRecord[]}
          onDelete={(id) => props.onDelete(id, 'record')}
          selectedRecords={props.selectedRecords}
          onCheckboxToggle={props.onCheckboxToggle}
          selectAll={props.selectAll}
          onSelectAllChange={props.onSelectAllChange}
          onSort={props.onSort}
          sortBy={props.sortBy}
          availableTags={props.availableTags}
          onOpenCampaignModal={props.onOpenCampaignModal}
          onAddTag={props.onAddTagToRecord}
          onRemoveTag={props.onRemoveTagFromRecord}
          onUpdateStatus={props.onUpdateRecordStatus}
          onRecordFieldEdit={props.onRecordFieldEdit}
          editingRecord={props.editingRecord}
          saveRecordFieldEdit={props.saveRecordFieldEdit}
          setEditingRecord={props.setEditingRecord as any}
        />
      )}
    </div>
  )
}

