"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, X } from "lucide-react"

interface Tag {
  id: string
  name: string
}

interface TagSelectorProps {
  tags: Tag[] | undefined
  selectedTags: string[]
  onTagAdd: (tagId: string) => void
  onTagRemove: (tagId: string) => void
}

export function TagSelector({ tags, selectedTags, onTagAdd, onTagRemove }: TagSelectorProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-1">
        {tags
          ?.filter((tag) => selectedTags.includes(tag.id))
          .map((tag) => (
            <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTagRemove(tag.id)}
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${tag.name} tag`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Tag
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {tags
              ?.filter((tag) => !selectedTags.includes(tag.id))
              .map((tag) => (
                <DropdownMenuItem key={tag.id} onClick={() => onTagAdd(tag.id)}>
                  {tag.name}
                </DropdownMenuItem>
              ))}
            {(!tags || tags.filter((tag) => !selectedTags.includes(tag.id)).length === 0) && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No more tags available</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
