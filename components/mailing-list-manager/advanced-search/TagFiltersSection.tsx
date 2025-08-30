"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { TagFilter, TagFilterOperator, Tag } from "./types"

interface TagFiltersSectionProps {
  tagFilter: TagFilter | null
  tags: Tag[]
  onSetTagFilter: (filter: TagFilter | null) => void
}

export function TagFiltersSection({
  tagFilter,
  tags,
  onSetTagFilter,
}: TagFiltersSectionProps) {
  const handleTagSelect = (tagId: string) => {
    if (tagFilter?.tagIds.includes(tagId)) {
      const newTagIds = tagFilter.tagIds.filter((id) => id !== tagId)
      if (newTagIds.length === 0) {
        onSetTagFilter(null)
      } else {
        onSetTagFilter({
          ...tagFilter,
          tagIds: newTagIds,
        })
      }
    } else {
      const currentTagIds = tagFilter?.tagIds || []
      onSetTagFilter({
        id: tagFilter?.id || `tag-${Date.now()}`,
        operator: tagFilter?.operator || "hasAny",
        tagIds: [...currentTagIds, tagId],
      })
    }
  }

  const handleOperatorChange = (value: string) => {
    if (!tagFilter) {
      onSetTagFilter({
        id: `tag-${Date.now()}`,
        operator: value as TagFilterOperator,
        tagIds: [],
      })
    } else {
      onSetTagFilter({
        ...tagFilter,
        operator: value as TagFilterOperator,
      })
    }
  }

  return (
    <div className="flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
      <h3 className="text-base font-semibold mb-2">Tag Filters</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Filter by tags to match records with specific tag combinations.
      </p>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Label className="whitespace-nowrap">Filter Type</Label>
          <Select
            value={tagFilter?.operator || "hasAny"}
            onValueChange={handleOperatorChange}
          >
            <SelectTrigger className="w-auto min-w-[180px]">
              <SelectValue placeholder="Select filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hasAll">Has all selected tags</SelectItem>
              <SelectItem value="hasAny">Has any selected tags</SelectItem>
              <SelectItem value="hasNone">Has none of the selected tags</SelectItem>
              <SelectItem value="hasOnly">Has only the selected tags</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-md w-full">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search tags..." />
            <CommandList className="h-[200px] max-h-[200px] overflow-auto">
              <CommandEmpty>No tag found.</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleTagSelect(tag.id)}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={tagFilter?.tagIds.includes(tag.id)}
                        className="pointer-events-none"
                      />
                      <span className="truncate">{tag.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {tagFilter && tagFilter.tagIds.length > 0 && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-wrap gap-1 max-w-[70%]">
              {tagFilter.tagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId)
                return tag ? (
                  <Badge key={tag.id} variant="outline" className="mb-1">
                    {tag.name}
                  </Badge>
                ) : null
              })}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSetTagFilter(null)}>
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}