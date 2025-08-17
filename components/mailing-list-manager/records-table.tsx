"use client"

import type React from "react"

import { useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Ban, MailX, Trash, X, ChevronUp, ChevronDown } from "lucide-react"
import { TagsDropdown } from "./tags-dropdown"
import { CampaignUsageTooltip } from "./campaign-usage-tooltip"
import { CustomizableTable, type ColumnDef } from "./customizable-table"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { formatDate } from "@/lib/utils"

interface RecordsTableProps {
  records: any[]
  selectedRecords: string[]
  onCheckboxToggle: (id: string) => void
  selectAll: boolean
  onSelectAllChange: (checked: boolean) => void
  sortBy: { column: string; direction: "asc" | "desc" }
  onSort: (column: string) => void
  onDelete: (id: string) => void
  onAddTag: (listId: string, tagId: string) => void
  onRemoveTag: (listId: string, tagId: string) => void
  onUpdateStatus: (id: string, status: "active" | "doNotContact" | "returnedMail") => void
  onRecordFieldEdit: (id: string, field: string, value: string) => void
  editingRecord: { id: string; field: string; value: string } | null
  saveRecordFieldEdit: () => void
  setEditingRecord: (value: { id: string; field: string; value: any; } | null) => void
  availableTags: { id: string; name: string }[]
  onOpenCampaignModal: (campaigns: any[], title: string) => void
  onCreateCampaignList?: () => void // Add this new prop
}

export function RecordsTable({
  records,
  selectedRecords,
  onCheckboxToggle,
  selectAll,
  onSelectAllChange,
  sortBy,
  onSort,
  onDelete,
  onAddTag,
  onRemoveTag,
  onUpdateStatus,
  onRecordFieldEdit,
  editingRecord,
  saveRecordFieldEdit,
  setEditingRecord,
  availableTags,
  onOpenCampaignModal,
  onCreateCampaignList,
}: RecordsTableProps) {
  // Add this at the top of the RecordsTable component function
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
    "table-name-format-mailing-records",
    "lastFirst",
  )

  // Function to extract numeric ID from record ID
  const getNumericId = (recordId: string) => {
    // Extract the numeric part at the end of the ID
    const match = recordId.match(/\d+$/)
    if (match) {
      return match[0]
    }

    // If no match found, generate a numeric hash from the string
    let hash = 0
    for (let i = 0; i < recordId.length; i++) {
      const char = recordId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString().substring(0, 8)
  }

  // Define columns
  const columns = useMemo<ColumnDef[]>(
    () => [
      {
        id: "select",
        header: <Checkbox checked={selectAll} onCheckedChange={onSelectAllChange} aria-label="Select all" />,
        cell: (record) => (
          <Checkbox
            checked={selectedRecords.includes(record.id)}
            onCheckedChange={() => onCheckboxToggle(record.id)}
            aria-label={`Select ${record.firstName} ${record.lastName}`}
          />
        ),
        enableSorting: false,
        minWidth: 50,
        maxWidth: 70,
      },
      {
        id: "rowNumber",
        header: "Row",
        cell: (record, index) => index + 1,
        enableSorting: false,
        minWidth: 60,
        maxWidth: 60,
        hidden: true, // Hidden by default but can be toggled
      },
      {
        id: "actions",
        header: "Actions",
        cell: (record) => (
          <div className="flex items-center gap-1 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUpdateStatus(record.id, record.status === "doNotContact" ? "active" : "doNotContact")
                    }
                    className={`yellow-hover-button ${record.status === "doNotContact" ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : ""}`}
                  >
                    <Ban className="h-4 w-4" />
                    <span className="sr-only">
                      {record.status === "doNotContact" ? "Reactivate" : "Mark as Do Not Contact"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{record.status === "doNotContact" ? "Reactivate" : "Mark as Do Not Contact"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUpdateStatus(record.id, record.status === "returnedMail" ? "active" : "returnedMail")
                    }
                    className={`yellow-hover-button ${record.status === "returnedMail" ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : ""}`}
                  >
                    <MailX className="h-4 w-4" />
                    <span className="sr-only">
                      {record.status === "returnedMail" ? "Reactivate" : "Mark as Returned Mail"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{record.status === "returnedMail" ? "Reactivate" : "Mark as Returned Mail"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(record.listId)}
                    className="yellow-hover-button"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Record</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        enableSorting: false,
        minWidth: 220,
      },
      {
        id: "tags",
        header: "Tags",
        cell: (record) => (
          <div className="flex flex-wrap gap-1 items-center">
            {record.tags.map((tag: any) => (
              <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                {tag.name}
                <button
                  onClick={() => onRemoveTag(record.listId, tag.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <TagsDropdown
              listId={record.listId}
              currentTags={record.tags}
              availableTags={availableTags}
              onAddTag={(tagId) => onAddTag(record.listId, tagId)}
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
        cell: (record) => (
          <div className="flex items-center">
            <CampaignUsageTooltip
              campaigns={record.campaigns}
              onOpenModal={(campaigns, title) =>
                onOpenCampaignModal(campaigns, `Campaign Usage: ${record.firstName} ${record.lastName}`)
              }
              title={`Campaign Usage: ${record.firstName} ${record.lastName}`}
              isList={false}
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
        cell: (record) => getNumericId(record.id),
        enableSorting: true,
        minWidth: 80,
        maxWidth: 100,
        hidden: true, // Hidden by default but can be toggled
      },
      {
        id: "name",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("name")}>
            Name
            {sortBy.column === "name" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) => (
          <div className="flex gap-1">
            {nameFormat === "lastFirst" ? (
              <>
                {/* Last Name */}
                {editingRecord && editingRecord.id === record.id && editingRecord.field === "lastName" ? (
                  <Input
                    value={editingRecord.value}
                    onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                    onBlur={saveRecordFieldEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRecordFieldEdit()
                      if (e.key === "Escape") setEditingRecord(null)
                    }}
                    autoFocus
                    className="w-24 h-8"
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:underline"
                    onClick={() => onRecordFieldEdit(record.id, "lastName", record.lastName)}
                  >
                    {record.lastName},
                  </div>
                )}

                {/* First Name */}
                {editingRecord && editingRecord.id === record.id && editingRecord.field === "firstName" ? (
                  <Input
                    value={editingRecord.value}
                    onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                    onBlur={saveRecordFieldEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRecordFieldEdit()
                      if (e.key === "Escape") setEditingRecord(null)
                    }}
                    autoFocus
                    className="w-24 h-8"
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:underline"
                    onClick={() => onRecordFieldEdit(record.id, "firstName", record.firstName)}
                  >
                    {record.firstName}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* First Name */}
                {editingRecord && editingRecord.id === record.id && editingRecord.field === "firstName" ? (
                  <Input
                    value={editingRecord.value}
                    onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                    onBlur={saveRecordFieldEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRecordFieldEdit()
                      if (e.key === "Escape") setEditingRecord(null)
                    }}
                    autoFocus
                    className="w-24 h-8"
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:underline"
                    onClick={() => onRecordFieldEdit(record.id, "firstName", record.firstName)}
                  >
                    {record.firstName}
                  </div>
                )}

                {/* Last Name */}
                {editingRecord && editingRecord.id === record.id && editingRecord.field === "lastName" ? (
                  <Input
                    value={editingRecord.value}
                    onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                    onBlur={saveRecordFieldEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRecordFieldEdit()
                      if (e.key === "Escape") setEditingRecord(null)
                    }}
                    autoFocus
                    className="w-24 h-8"
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:underline"
                    onClick={() => onRecordFieldEdit(record.id, "lastName", record.lastName)}
                  >
                    {record.lastName}
                  </div>
                )}
              </>
            )}
          </div>
        ),
        enableSorting: true,
        minWidth: 150,
      },
      {
        id: "address",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("address")}>
            Address
            {sortBy.column === "address" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) =>
          editingRecord && editingRecord.id === record.id && editingRecord.field === "address" ? (
            <Input
              value={editingRecord.value}
              onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
              onBlur={saveRecordFieldEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRecordFieldEdit()
                if (e.key === "Escape") setEditingRecord(null)
              }}
              autoFocus
              className="w-full h-8"
            />
          ) : (
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onRecordFieldEdit(record.id, "address", record.address)}
            >
              {record.address}
            </div>
          ),
        enableSorting: true,
        minWidth: 200,
        maxWidth: 300, // Add a maximum width constraint
        autoSize: true,
      },
      {
        id: "city",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("city")}>
            City
            {sortBy.column === "city" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) =>
          editingRecord && editingRecord.id === record.id && editingRecord.field === "city" ? (
            <Input
              value={editingRecord.value}
              onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
              onBlur={saveRecordFieldEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRecordFieldEdit()
                if (e.key === "Escape") setEditingRecord(null)
              }}
              autoFocus
              className="w-full h-8"
            />
          ) : (
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onRecordFieldEdit(record.id, "city", record.city)}
            >
              {record.city}
            </div>
          ),
        enableSorting: true,
        minWidth: 120,
      },
      {
        id: "state",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("state")}>
            State
            {sortBy.column === "state" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) =>
          editingRecord && editingRecord.id === record.id && editingRecord.field === "state" ? (
            <Input
              value={editingRecord.value}
              onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
              onBlur={saveRecordFieldEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRecordFieldEdit()
                if (e.key === "Escape") setEditingRecord(null)
              }}
              autoFocus
              className="w-16 h-8"
            />
          ) : (
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onRecordFieldEdit(record.id, "state", record.state)}
            >
              {record.state}
            </div>
          ),
        enableSorting: true,
        minWidth: 80,
      },
      {
        id: "zipCode",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("zipCode")}>
            Zip Code
            {sortBy.column === "zipCode" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) =>
          editingRecord && editingRecord.id === record.id && editingRecord.field === "zipCode" ? (
            <Input
              value={editingRecord.value}
              onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
              onBlur={saveRecordFieldEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRecordFieldEdit()
                if (e.key === "Escape") setEditingRecord(null)
              }}
              autoFocus
              className="w-20 h-8"
            />
          ) : (
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onRecordFieldEdit(record.id, "zipCode", record.zipCode)}
            >
              {record.zipCode}
            </div>
          ),
        enableSorting: true,
        minWidth: 100,
      },
      {
        id: "listName",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("listName")}>
            List
            {sortBy.column === "listName" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) => <Badge variant="outline">{record.listName}</Badge>,
        enableSorting: true,
        minWidth: 120,
      },
      {
        id: "createdDate",
        header: (
          <div className="flex items-center cursor-pointer" onClick={() => onSort("createdDate")}>
            Created Date
            {sortBy.column === "createdDate" &&
              (sortBy.direction === "asc" ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              ))}
          </div>
        ),
        cell: (record) => (record.createdDate ? formatDate(record.createdDate) : "Unknown"),
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
        cell: (record) => record.createdBy || "System",
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
        cell: (record) => (record.modifiedDate ? formatDate(record.modifiedDate) : "Never"),
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
        cell: (record) => record.modifiedBy || "N/A",
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
      onUpdateStatus,
      onDelete,
      onRecordFieldEdit,
      editingRecord,
      saveRecordFieldEdit,
      setEditingRecord,
      onOpenCampaignModal,
      onRemoveTag,
      onAddTag,
      availableTags,
      nameFormat,
      onCreateCampaignList,
    ],
  )

  // Handle name format change from the CustomizableTable
  const handleNameFormatChange = (format: "lastFirst" | "firstLast") => {
    setNameFormat(format)
  }

  return (
    <>
      <CustomizableTable
        data={records}
        columns={columns}
        tableId="mailing-records"
        showDataOperations={true}
        onNameFormatChange={handleNameFormatChange}
        onCreateCampaignList={onCreateCampaignList}
        renderRow={(record, visibleColumns, columnStates, index) => {
          // Create a stable key for the row
          const rowKey = `row-${record.id}`

          return (
            <tr
              key={rowKey}
              className={`hover:bg-muted/50 ${
                record.status === "doNotContact"
                  ? "bg-red-50 dark:bg-red-950/20"
                  : record.status === "returnedMail"
                    ? "bg-amber-50 dark:bg-amber-950/20"
                    : ""
              }`}
            >
              {visibleColumns.map((column) => {
                // Create a stable key for the cell
                const cellKey = `${rowKey}-${column.id}`

                // Determine background color based on record status
                let bgColor = "bg-white dark:bg-gray-950"
                if (record.status === "doNotContact") {
                  bgColor = "bg-red-50 dark:bg-red-950/20"
                } else if (record.status === "returnedMail") {
                  bgColor = "bg-amber-50 dark:bg-amber-950/20"
                }

                return (
                  <td
                    key={cellKey}
                    data-column-id={column.id}
                    className={`py-3 overflow-hidden text-ellipsis whitespace-nowrap ${
                      column.id === "select"
                        ? `sticky z-10 ${bgColor} px-4`
                        : column.id === "actions"
                          ? `sticky z-10 ${bgColor} px-2 border-r border-gray-200 dark:border-gray-700`
                          : "px-4"
                    }`}
                    style={{
                      width:
                        column.id === "rowNumber"
                          ? "60px"
                          : column.id === "id"
                            ? "100px"
                            : column.id === "actions"
                              ? "220px"
                              : `${columnStates[column.id]?.width || column.minWidth || 150}px`,
                      minWidth:
                        column.id === "rowNumber"
                          ? "60px"
                          : column.id === "id"
                            ? "80px"
                            : column.id === "actions"
                              ? "220px"
                              : column.minWidth || 150,
                      left:
                        column.id === "select"
                          ? 0
                          : column.id === "actions"
                            ? columnStates["select"]?.width || 70
                            : undefined,
                      boxShadow:
                        column.id === "select" || column.id === "actions"
                          ? "4px 0 6px -2px rgba(0, 0, 0, 0.1)"
                          : undefined,
                      whiteSpace: "nowrap", // Add this line
                      overflow: "hidden", // Add this line
                      textOverflow: "ellipsis", // Add this line
                    }}
                  >
                    {column.cell ? column.cell(record, index) : null}
                  </td>
                )
              })}
            </tr>
          )
        }}
      />
    </>
  )
}
