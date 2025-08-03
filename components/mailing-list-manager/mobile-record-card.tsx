"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ban, MailX, Trash, X } from "lucide-react"
import { TagsDropdown } from "./tags-dropdown"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate } from "@/lib/utils"

interface MobileRecordCardProps {
  record: any
  onDelete: (id: string) => void
  onAddTag: (listId: string, tagId: string) => void
  onRemoveTag: (listId: string, tagId: string) => void
  onUpdateStatus: (id: string, status: "active" | "doNotContact" | "returnedMail") => void
  onFieldEdit?: (id: string, field: string, value: string) => void
  onOpenCampaignModal?: (campaigns: any[], title: string) => void
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  availableTags: any[]
}

export function MobileRecordCard({
  record,
  onDelete,
  onAddTag,
  onRemoveTag,
  onUpdateStatus,
  onFieldEdit,
  onOpenCampaignModal,
  isSelected,
  onToggleSelect,
  availableTags,
}: MobileRecordCardProps) {
  // State for name format preference
  const [nameFormat] = useLocalStorage<"lastFirst" | "firstLast">("table-name-format-mailing-records", "lastFirst")

  return (
    <div
      className={`p-4 border rounded-lg mb-4 ${
        record.status === "doNotContact"
          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30"
          : record.status === "returnedMail"
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30"
            : "bg-card"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isSelected !== undefined && onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(record.id)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            )}

            <h3 className="text-lg font-medium">
              {nameFormat === "lastFirst" ? (
                <>
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => onFieldEdit && onFieldEdit(record.id, "lastName", record.lastName)}
                  >
                    {record.lastName},
                  </span>{" "}
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => onFieldEdit && onFieldEdit(record.id, "firstName", record.firstName)}
                  >
                    {record.firstName}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => onFieldEdit && onFieldEdit(record.id, "firstName", record.firstName)}
                  >
                    {record.firstName}
                  </span>{" "}
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => onFieldEdit && onFieldEdit(record.id, "lastName", record.lastName)}
                  >
                    {record.lastName}
                  </span>
                </>
              )}
            </h3>
          </div>
          <Badge variant="outline" className="mt-1">
            {record.listName}
          </Badge>
        </div>

        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateStatus(record.id, record.status === "doNotContact" ? "active" : "doNotContact")
                  }
                  className={`${record.status === "doNotContact" ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : ""}`}
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
                  className={`${record.status === "returnedMail" ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" : ""}`}
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
                <Button variant="outline" size="sm" onClick={() => onDelete(record.listId)}>
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
      </div>

      <div className="grid grid-cols-1 gap-2 mb-3">
        <div>
          <div className="text-sm text-muted-foreground">Address</div>
          <div
            className="cursor-pointer hover:underline"
            onClick={() => onFieldEdit && onFieldEdit(record.id, "address", record.address)}
          >
            {record.address}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-sm text-muted-foreground">City</div>
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onFieldEdit && onFieldEdit(record.id, "city", record.city)}
            >
              {record.city}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">State</div>
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onFieldEdit && onFieldEdit(record.id, "state", record.state)}
            >
              {record.state}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Zip</div>
            <div
              className="cursor-pointer hover:underline"
              onClick={() => onFieldEdit && onFieldEdit(record.id, "zipCode", record.zipCode)}
            >
              {record.zipCode}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <p className="text-xs text-muted-foreground">Created Date</p>
          <p className="text-sm">{record.createdDate ? formatDate(record.createdDate) : "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Created By</p>
          <p className="text-sm">{record.createdBy || "System"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <p className="text-xs text-muted-foreground">Modified Date</p>
          <p className="text-sm">{record.modifiedDate ? formatDate(record.modifiedDate) : "Never"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Modified By</p>
          <p className="text-sm">{record.modifiedBy || "N/A"}</p>
        </div>
      </div>

      <div className="mb-3 mt-3">
        <div className="text-sm text-muted-foreground mb-1">Tags</div>
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
      </div>

      <div>
        <div className="text-sm text-muted-foreground mb-1">Campaign Usage</div>
        {record.campaigns.length > 0 ? (
          <span
            className="text-sm text-blue-600 cursor-pointer hover:underline"
            onClick={() =>
              onOpenCampaignModal &&
              onOpenCampaignModal(record.campaigns, `Campaign Usage for ${record.firstName} ${record.lastName}`)
            }
          >
            {record.campaigns.length} campaign{record.campaigns.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Not used</span>
        )}
      </div>
    </div>
  )
}
