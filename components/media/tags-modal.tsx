"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { ensureTagExists } from '@/lib/tag-manager/tag-utils'

interface TagsModalProps {
  isOpen: boolean
  onClose: () => void
  assets: any[] // Array of assets to manage tags for
  onTagsUpdate: () => void // Callback to refresh assets after tag changes
  allMediaFiles?: any[] // All media files to extract available tags from
}

export function TagsModal({ isOpen, onClose, assets, onTagsUpdate, allMediaFiles = [] }: TagsModalProps) {
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<any[]>([])

  // Get all unique tags from the selected assets
  useEffect(() => {
    if (assets.length > 0) {
      const allTags = new Set<string>()
      assets.forEach(asset => {
        const tags = asset.metadata?.tags || []
        tags.forEach((tag: string) => allTags.add(tag))
      })
      setExistingTags(Array.from(allTags).sort())
    }
  }, [assets])

  // Fetch available tags from Tag Manager system
  useEffect(() => {
    const fetchAvailableTags = async () => {
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
        } else {
          throw new Error('Failed to fetch tags')
        }
      } catch (error) {
        console.error('Error fetching tags:', error)
        // Fallback: extract from media files if Tag Manager system fails
        if (allMediaFiles.length > 0) {
          const allTags = new Set<string>()
          allMediaFiles.forEach(file => {
            const tags = file.metadata?.tags || []
            tags.forEach((tag: string) => allTags.add(tag))
          })
          const sortedTags = Array.from(allTags).sort().map(name => ({ name }))
          setAvailableTags(sortedTags)
        }
      }
    }

    fetchAvailableTags()
  }, [allMediaFiles])

  const handleAddTag = async (tagToAdd?: string) => {
    const tag = tagToAdd || newTag.trim()
    if (!tag) return

    const trimmedTag = tag.toLowerCase()

    // Check if tag already exists on any of the selected assets
    if (existingTags.includes(trimmedTag)) {
      toast.error('This tag is already applied to the selected files')
      return
    }

    setIsLoading(true)
    try {
      // Ensure tag exists in Tag Manager (only for new tags created via input)
      if (!tagToAdd) {
        try {
          await ensureTagExists(trimmedTag)
        } catch (error) {
          console.error('Error ensuring tag exists in Tag Manager:', error)
          // Continue with adding tag to assets even if Tag Manager creation fails
        }
      }

      // Add tag to all selected assets
      for (const asset of assets) {
        const currentTags = asset.metadata?.tags || []
        const updatedTags = [...currentTags, trimmedTag]

        await fetch('/api/assets', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assetId: asset.id,
            tags: updatedTags
          }),
        })
      }

      toast.success(`Added "${trimmedTag}" to ${assets.length} file${assets.length !== 1 ? 's' : ''}`)
      if (!tagToAdd) setNewTag('') // Only clear input if adding from input field
      onTagsUpdate()

      // Update existing tags list
      setExistingTags(prev => [...prev, trimmedTag].sort())
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error('Failed to add tag')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAllTags = async () => {
    if (existingTags.length === 0) return

    setIsLoading(true)
    try {
      // Clear all tags from selected assets
      for (const asset of assets) {
        await fetch('/api/assets', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assetId: asset.id,
            tags: []
          }),
        })
      }

      toast.success(`Cleared all tags from ${assets.length} file${assets.length !== 1 ? 's' : ''}`)
      onTagsUpdate()
      setExistingTags([])
    } catch (error) {
      console.error('Error clearing tags:', error)
      toast.error('Failed to clear tags')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Manage Tags - {assets.length} file{assets.length !== 1 ? 's' : ''} selected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Tags */}
          <div>
            <Label className="text-sm font-medium">Current tags on selected files:</Label>
            <div className="mt-2 min-h-[60px] p-3 border rounded-md bg-muted/50">
              {existingTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {existingTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags applied</p>
              )}
            </div>
          </div>

          {/* Available Tags */}
          <div>
            <Label className="text-sm font-medium">Available tags (click to add):</Label>
            <div className="mt-2 max-h-32 overflow-y-auto p-3 border rounded-md bg-background">
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => !existingTags.includes(tag.name.toLowerCase())) // Only show tags not already applied
                    .map((tag) => (
                      <Badge
                        key={tag.id || tag.name}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleAddTag(tag.name)}
                        style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                </div>
              ) : null}
              {(availableTags.length === 0 || availableTags.filter(tag => !existingTags.includes(tag.name.toLowerCase())).length === 0) && (
                <p className="text-sm text-muted-foreground">
                  {availableTags.length === 0 ? 'No tags available. Create tags in Tag Manager first.' : 'All available tags are already applied'}
                </p>
              )}
            </div>
          </div>

          {/* Add New Tag */}
          <div>
            <Label htmlFor="new-tag" className="text-sm font-medium">Add new tag:</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="new-tag"
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                onClick={() => handleAddTag()}
                disabled={!newTag.trim() || isLoading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleClearAllTags}
            disabled={existingTags.length === 0 || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Tags
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onClose} disabled={isLoading}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}