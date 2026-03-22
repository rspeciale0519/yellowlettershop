"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Hash } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { ensureTagExists } from '@/lib/tag-manager/tag-utils'

interface Tag {
  id: string
  name: string
  color?: string
}

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  label?: string
  placeholder?: string
  showClearAll?: boolean
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  label = "Tags",
  placeholder = "Enter tag name...",
  showClearAll = true
}: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch available tags from Tag Manager system
  useEffect(() => {
    const fetchAvailableTags = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const response = await fetch(`/api/tags?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableTags()
  }, [])

  const handleAddTag = async (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim()
    if (!tag) return

    const trimmedTag = tag.toLowerCase()

    // Check if tag already exists in selected tags
    if (selectedTags.includes(trimmedTag)) {
      return // Tag already selected
    }

    // Ensure tag exists in Tag Manager (only for new tags created via input)
    if (!tagToAdd) {
      try {
        await ensureTagExists(trimmedTag)
      } catch (error) {
        console.error('Error ensuring tag exists in Tag Manager:', error)
        // Continue with adding tag even if Tag Manager creation fails
      }
    }

    const updatedTags = [...selectedTags, trimmedTag]
    onTagsChange(updatedTags)

    if (!tagToAdd) setNewTag('') // Only clear input if adding from input field
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove)
    onTagsChange(updatedTags)
  }

  const handleClearAllTags = () => {
    onTagsChange([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Filter available tags to show only those not already selected
  const unselectedTags = availableTags.filter(tag =>
    !selectedTags.includes(tag.name.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Current Selected Tags */}
      {selectedTags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Selected tags:</span>
            {showClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllTags}
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tagName) => {
              const tag = availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
              return (
                <Badge
                  key={tagName}
                  variant="default"
                  className="cursor-pointer hover:bg-primary/80 transition-colors text-xs"
                  onClick={() => handleRemoveTag(tagName)}
                  style={{
                    backgroundColor: tag?.color || undefined
                  }}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tagName}
                  <Trash2 className="h-3 w-3 ml-1" />
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Tags */}
      {unselectedTags.length > 0 && (
        <div>
          <span className="text-xs text-muted-foreground mb-2 block">
            Available tags (click to add):
          </span>
          <div className="max-h-24 overflow-y-auto p-2 border rounded-md bg-background">
            <div className="flex flex-wrap gap-1">
              {unselectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => handleAddTag(tag.name)}
                  style={{
                    backgroundColor: tag.color ? `${tag.color}15` : undefined,
                    borderColor: tag.color || undefined
                  }}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Tag */}
      <div>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm"
          />
          <Button
            onClick={() => handleAddTag()}
            disabled={!newTag.trim()}
            size="sm"
            variant="outline"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-xs text-muted-foreground">
          Loading tags...
        </div>
      )}

      {/* No Tags Available */}
      {!isLoading && availableTags.length === 0 && (
        <div className="text-xs text-muted-foreground">
          No tags available. Create tags in Tag Manager first.
        </div>
      )}
    </div>
  )
}