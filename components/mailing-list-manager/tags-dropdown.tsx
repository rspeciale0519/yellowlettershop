"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TagsDropdownProps {
  listId: string
  currentTags: { id: string; name: string }[]
  availableTags: { id: string; name: string }[]
  onAddTag: (tagId: string) => void
}

export function TagsDropdown({ listId, currentTags, availableTags, onAddTag }: TagsDropdownProps) {
  const [newTagName, setNewTagName] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)

  // Filter out tags that are already applied to this list
  const availableTagsFiltered = availableTags.filter(
    (tag) => !currentTags.some((currentTag) => currentTag.id === tag.id),
  )

  const handleCreateTag = () => {
    if (!newTagName.trim()) return

    // In a real implementation, this would create a new tag in the database
    // and then add it to the list
    const newTagId = `new-${Date.now()}`
    onAddTag(newTagId)

    setNewTagName("")
    setIsCreatingTag(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-6 w-6 rounded-full">
                <Plus className="h-3 w-3" />
                <span className="sr-only">Add Tag</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Tag</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {availableTagsFiltered.length > 0 ? (
          <>
            <div className="p-2 text-xs font-medium text-muted-foreground">Add existing tag</div>
            {availableTagsFiltered.map((tag) => (
              <DropdownMenuItem key={tag.id} onClick={() => onAddTag(tag.id)}>
                {tag.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <div className="p-2 text-xs text-muted-foreground">No more tags available</div>
        )}

        {isCreatingTag ? (
          <div className="p-2">
            <div className="text-xs font-medium mb-1">Create new tag</div>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreateTag()
                  }
                  if (e.key === "Escape") {
                    setIsCreatingTag(false)
                    setNewTagName("")
                  }
                }}
                autoFocus
              />
              <Button size="sm" className="h-8" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                Add
              </Button>
            </div>
          </div>
        ) : (
          <DropdownMenuItem onClick={() => setIsCreatingTag(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create new tag
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
