"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Edit, Trash, ShoppingCart, Tag, X } from "lucide-react"
import { TagsDropdown } from "./tags-dropdown"
import { formatDate } from "@/lib/utils"
import { CampaignUsageModal } from "./campaign-usage-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CampaignUsageTooltip } from "./campaign-usage-tooltip"

interface MobileListCardProps {
  list: {
    id: string
    name: string
    recordCount: number
    createdAt: string
    createdBy?: string
    modifiedDate?: string
    modifiedBy?: string
    tags: { id: string; name: string }[]
    campaigns: { id: string; orderId: string; mailedDate: string }[]
  }
  onEdit: () => void
  onDelete: () => void
  onUseInOrder: () => void
  onNameEdit: () => void
  onAddTag: (tagId: string) => void
  onRemoveTag: (tagId: string) => void
  availableTags: { id: string; name: string }[]
}

export function MobileListCard({
  list,
  onEdit,
  onDelete,
  onUseInOrder,
  onNameEdit,
  onAddTag,
  onRemoveTag,
  availableTags,
}: MobileListCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(list.name)
  const isMountedRef = useRef(true)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleNameSave = () => {
    if (!isMountedRef.current) return
    setEditingName(false)
    onNameEdit()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {editingName ? (
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave()
                  if (e.key === "Escape") {
                    setNameValue(list.name)
                    setEditingName(false)
                  }
                }}
                autoFocus
                className="mb-2"
              />
            ) : (
              <h3
                className="font-medium text-lg cursor-pointer hover:underline"
                onClick={() => {
                  setEditingName(true)
                }}
              >
                {list.name}
              </h3>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{list.recordCount.toLocaleString()} records</span>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{expanded ? "Collapse details" : "Expand details"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Created Date</p>
                <p className="text-sm">{formatDate(list.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="text-sm">{list.createdBy || "System"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Modified Date</p>
                <p className="text-sm">{list.modifiedDate ? formatDate(list.modifiedDate) : "Never"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Modified By</p>
                <p className="text-sm">{list.modifiedBy || "N/A"}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {list.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="flex items-center gap-1">
                    {tag.name}
                    <button onClick={() => onRemoveTag(tag.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <TagsDropdown
                  listId={list.id}
                  currentTags={list.tags}
                  availableTags={availableTags}
                  onAddTag={onAddTag}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Campaign Usage</span>
              </div>
              {list.campaigns.length > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="text-sm text-blue-600 cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setCampaignModalOpen(true)
                        }}
                      >
                        {list.campaigns.length} campaign{list.campaigns.length !== 1 ? "s" : ""}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <CampaignUsageTooltip campaigns={list.campaigns} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-sm text-muted-foreground">Not used</span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onEdit}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit List</span>
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
                    <Button variant="outline" size="sm" onClick={onDelete}>
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
                    <Button variant="outline" size="sm" onClick={onUseInOrder}>
                      <ShoppingCart className="h-4 w-4" />
                      <span className="sr-only">Use in Order</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use in Order</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </CardContent>
      <CampaignUsageModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        campaigns={list.campaigns}
        title={`Campaign Usage for ${list.name}`}
      />
    </Card>
  )
}
