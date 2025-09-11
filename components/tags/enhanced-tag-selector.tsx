"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Search, Tag, Edit, Plus, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TagData } from "./tag-form-modal"
import { getCategoryDisplayName } from "@/lib/constants/tag-categories"

interface TagWithCount extends TagData {
  count: number
}

interface EnhancedTagSelectorProps {
  selectedTags: string[]
  onSelectedTagsChange: (tags: string[]) => void
  onCreateTag: () => void
  onEditTag: (tag: TagData) => void
  disabled?: boolean
  className?: string
}

export function EnhancedTagSelector({
  selectedTags,
  onSelectedTagsChange,
  onCreateTag,
  onEditTag,
  disabled = false,
  className = ""
}: EnhancedTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [availableTags, setAvailableTags] = useState<TagWithCount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch tags with usage counts
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/tags/stats')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.stats || [])
        }
      } catch (error) {
        console.error('Error fetching tag stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchTags()
    }
  }, [isOpen])

  // Filter and group tags
  const { filteredTags, groupedTags } = useMemo(() => {
    const filtered = availableTags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const grouped = filtered.reduce((acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = []
      }
      acc[tag.category].push(tag)
      return acc
    }, {} as Record<string, TagWithCount[]>)

    // Sort categories: system first, then alphabetically
    const sortedGroups = Object.keys(grouped).sort((a, b) => {
      if (a === 'system') return -1
      if (b === 'system') return 1
      return a.localeCompare(b)
    })

    return { 
      filteredTags: filtered,
      groupedTags: sortedGroups.reduce((acc, key) => {
        acc[key] = grouped[key].sort((a, b) => {
          // Sort by count desc, then name asc
          if (a.count !== b.count) return b.count - a.count
          return a.name.localeCompare(b.name)
        })
        return acc
      }, {} as Record<string, TagWithCount[]>)
    }
  }, [availableTags, searchQuery])

  const handleTagToggle = (tagName: string) => {
    const isSelected = selectedTags.includes(tagName)
    if (isSelected) {
      onSelectedTagsChange(selectedTags.filter(t => t !== tagName))
    } else {
      onSelectedTagsChange([...selectedTags, tagName])
    }
  }

  const clearAllTags = () => {
    onSelectedTagsChange([])
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-[140px] justify-start ${className}`}
          disabled={disabled}
        >
          <Tag className="mr-2 h-4 w-4" />
          Tags
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
              {selectedTags.length}
            </Badge>
          )}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Select Tags</span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onCreateTag}
            className="h-6 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <DropdownMenuItem disabled className="justify-center">
              Loading tags...
            </DropdownMenuItem>
          ) : Object.keys(groupedTags).length === 0 ? (
            <DropdownMenuItem disabled className="justify-center">
              No tags found
            </DropdownMenuItem>
          ) : (
            Object.entries(groupedTags).map(([category, tags]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                  {getCategoryDisplayName(category)}
                </div>
                
                {/* Tags in Category */}
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center space-x-2 px-2 py-2 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => handleTagToggle(tag.name)}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border flex-shrink-0" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-sm truncate">
                      {tag.name}
                    </span>
                    {tag.count > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {tag.count}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTag(tag)
                      }}
                      className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {selectedTags.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearAllTags} className="text-muted-foreground">
              <X className="mr-2 h-4 w-4" />
              Clear all tags
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}