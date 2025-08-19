"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash, X, ChevronUp, ChevronDown, Upload, UserX, RotateCcw } from "lucide-react"
import { TagsDropdown } from "./tags-dropdown"
import { CampaignUsageTooltip } from "./campaign-usage-tooltip"
import { CustomizableTable, type ColumnDef } from "./customizable-table"
import { formatDate } from "@/lib/dashboard-utils"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useEffect, useMemo } from "react"

interface ListsTableProps {
  lists: any[]
  selectedRecords: string[]
  onCheckboxToggle: (id: string) => void
  selectAll: boolean
  onSelectAllChange: (checked: boolean | "indeterminate") => void
  sortBy: { column: string; direction: "asc" | "desc" }
  onSort: (column: string) => void
  onEdit: (id: string) => void
  onViewRecords: (id: string) => void
  onDelete: (id: string) => void
  onNameEdit: (id: string, name: string) => void
  onAddTag: (listId: string, tagId: string) => void
  onRemoveTag: (listId: string, tagId: string) => void
  availableTags: { id: string; name: string }[]
  editingName: { id: string; value: string } | null
  saveNameEdit: () => void
  setEditingName: (value: { id: string; value: string } | null) => void
  onOpenCampaignModal: (campaigns: any[], title: string) => void
  onOpenCSVImport: (id: string) => void
  onOpenDeduplication: (id: string) => void
  onOpenVersionHistory: (id: string) => void
}

export const ListsTable = ({
  lists,
  sortBy,
  onSort,
  onEdit,
  onViewRecords,
  onDelete,
  onNameEdit,
  onAddTag,
  onRemoveTag,
  availableTags,
  editingName,
  saveNameEdit,
  setEditingName,
  onOpenCampaignModal,
  selectedRecords,
  onCheckboxToggle,
  selectAll,
  onSelectAllChange,
  onOpenCSVImport,
  onOpenDeduplication,
  onOpenVersionHistory,
}: ListsTableProps) => {
  // Add this at the top of the ListsTable component function
  useEffect(() => {
    // Cleanup function to ensure any ResizeObserver is disconnected
    return () => {
      // This is a no-op if no ResizeObserver is used, but helps prevent memory leaks
      if (typeof window !== "undefined" && window.ResizeObserver) {
        // Just a safety measure
      }
    }
  }, [])
  // State for name format preference
  const [nameFormat, setNameFormat] = useLocalStorage<"lastFirst" | "firstLast">(
    "table-name-format-mailing-lists",
    "lastFirst",
  )

  // Handle name format change from the CustomizableTable
  const handleNameFormatChange = (format: "lastFirst" | "firstLast") => {
    setNameFormat(format)
  }

  // Define columns
  const columns = useMemo<ColumnDef[]>(
    () => [
      {
        id: "select",
        header: <Checkbox checked={selectAll} onCheckedChange={onSelectAllChange} aria-label="Select all" />,
        cell: (list) => (
          <Checkbox
            checked={selectedRecords.includes(list.id)}
            onCheckedChange={() => onCheckboxToggle(list.id)}
            aria-label={`Select ${list.name}`}
          />
        ),
        enableSorting: false,
        minWidth: 50,
        maxWidth: 70,
      },
      {
        id: "rowNumber",
        header: "Row",
                cell: (list, index) => (index !== undefined ? index + 1 : ""),
        enableSorting: false,
        minWidth: 60,
        maxWidth: 60,
        hidden: true, // Hidden by default but can be toggled
      },
      {
        id: "actions",
        header: "Actions",
        cell: (list) => (
          <div className="flex items-center gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onEdit(list.id)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit List</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onDelete(list.id)}>
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete List</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onOpenCSVImport(list.id)}>
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Import CSV</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onOpenDeduplication(list.id)}>
                    <UserX className="h-4 w-4" />
                    <span className="sr-only">Deduplicate</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deduplicate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => onOpenVersionHistory(list.id)}>
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">Version History</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Version History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        enableSorting: false,
        minWidth: 240,
      },
      {
        id: "tags",
        header: "Tags",
        cell: (list) => (
          <div className="flex flex-wrap gap-1 items-center">
            {list.tags.map((tag: any) => (
              <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                {tag.name}
                <button
                  onClick={() => onRemoveTag(list.id, tag.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <TagsDropdown
              listId={list.id}
              currentTags={list.tags}
              availableTags={availableTags}
              onAddTag={(tagId) => onAddTag(list.id, tagId)}
            />
          </div>
        ),
        enableSorting: false,
        minWidth: 200,
        maxWidth: 250, // Add a maximum width constraint
      },
      {
        id: "campaigns",
        header: "Campaign Usage",
        cell: (list) => (
          <div className="flex items-center">
            <CampaignUsageTooltip
              campaigns={list.campaigns}
              onOpenModal={(campaigns, title) => onOpenCampaignModal(campaigns, `Campaign Usage: ${list.name}`)}
              title={`Campaign Usage: ${list.name}`}
              isList={true}
              recordCount={list.recordCount}
            />
          </div>
        ),
        enableSorting: false,
        minWidth: 150,
      },
      {
        id: "id",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("id")}>
            ID
            {sortBy.column === "id" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) => list.id,
        enableSorting: true,
        minWidth: 80,
        maxWidth: 100,
        hidden: true, // Hidden by default but can be toggled
      },
      {
        id: "name",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("name")}>
            List Name
            {sortBy.column === "name" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) =>
          editingName && editingName.id === list.id ? (
            <Input
              value={editingName.value}
              onChange={(e) => setEditingName({ ...editingName, value: e.target.value })}
              onBlur={saveNameEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNameEdit()
                if (e.key === "Escape") setEditingName(null)
              }}
              autoFocus
              className="max-w-[200px]"
            />
          ) : (
            <div className="cursor-pointer hover:underline" onClick={() => onViewRecords(list.id)} onDoubleClick={() => onNameEdit(list.id, list.name)}>
              {list.name}
            </div>
          ),
        enableSorting: true,
        minWidth: 200,
        maxWidth: 250, // Add a maximum width constraint
        autoSize: true,
      },
      {
        id: "recordCount",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("recordCount")}>
            Record Count
            {sortBy.column === "recordCount" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) => list.recordCount.toLocaleString(),
        enableSorting: true,
        minWidth: 120,
      },
      {
        id: "createdAt",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("createdAt")}>
            Created Date
            {sortBy.column === "createdAt" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) => formatDate(list.createdAt),
        enableSorting: true,
        minWidth: 150,
      },
      {
        id: "createdBy",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("createdBy")}>
            Created By
            {sortBy.column === "createdBy" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) => list.createdBy || "System",
        enableSorting: true,
        minWidth: 150,
      },
      {
        id: "modifiedDate",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("modifiedDate")}>
            Modified Date
            {sortBy.column === "modifiedDate" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) => (list.modifiedDate ? formatDate(list.modifiedDate) : "Never"),
        enableSorting: true,
        minWidth: 150,
      },
      {
        id: "modifiedBy",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("modifiedBy")}>
            Modified By
            {sortBy.column === "modifiedBy" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (list) => list.modifiedBy || "N/A",
        enableSorting: true,
        minWidth: 150,
      },
    ],
    [
      selectAll,
      onSelectAllChange,
      selectedRecords,
      onCheckboxToggle,
      sortBy,
      onSort,
      onEdit,
      onDelete,
      editingName,
      setEditingName,
      saveNameEdit,
      onNameEdit,
      availableTags,
      onAddTag,
      onRemoveTag,
      onOpenCampaignModal,
      onOpenCSVImport,
      onOpenDeduplication,
      onOpenVersionHistory,
    ],
  )

  return (
    <CustomizableTable
      data={lists}
      columns={columns}
      tableId="mailing-lists"
      showDataOperations={false}
      onNameFormatChange={handleNameFormatChange}
      renderRow={(list, visibleColumns, columnStates, index) => (
        <tr key={list.id} className="hover:bg-muted/50">
          {visibleColumns.map((column) => (
            <td
              key={`${list.id}-${column.id}`}
              className={`py-3 overflow-hidden text-ellipsis whitespace-nowrap ${
                column.id === "select"
                  ? "sticky bg-white dark:bg-gray-950 z-10 px-4"
                  : column.id === "actions"
                    ? "sticky bg-white dark:bg-gray-950 z-10 px-2 border-r border-gray-200 dark:border-gray-700"
                    : "px-4"
              }`}
              style={{
                width:
                  column.id === "rowNumber"
                    ? "60px"
                    : column.id === "id"
                      ? "100px"
                      : column.id === "actions"
                        ? "240px"
                        : `${columnStates[column.id]?.width || column.minWidth || 150}px`,
                minWidth: column.minWidth || "auto",
                left:
                  column.id === "select"
                    ? 0
                    : column.id === "actions"
                      ? columnStates["select"]?.width || 70
                      : undefined,
                boxShadow:
                  column.id === "select" || column.id === "actions" ? "4px 0 6px -2px rgba(0, 0, 0, 0.1)" : undefined,
                whiteSpace: "nowrap", // Add this line
                overflow: "hidden", // Add this line
                textOverflow: "ellipsis", // Add this line
              }}
            >
              {column.cell ? column.cell(list, index) : null}
            </td>
          ))}
        </tr>
      )}
    />
  )
}
