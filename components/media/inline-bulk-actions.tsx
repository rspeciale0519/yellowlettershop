"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Trash2,
  Tag,
  Download,
  X,
  CheckSquare,
  Square,
  Plus,
  Check,
} from "lucide-react"
import { ColoredTagPills } from "@/components/tags/colored-tag-pills"

interface TagData {
  id: string
  name: string
  description?: string
  category: string
  color: string
  visibility: 'public' | 'private' | 'system'
  sort_order: number
  user_id: string
  team_id?: string
  is_system: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  count: number
}

interface InlineBulkActionsProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkDelete: () => void
  onBulkTag: (tags: string[], action: 'add' | 'remove') => void
  onBulkDownload: () => void
  onExitBulkMode: () => void
  allSelected: boolean
  isDownloading?: boolean
}

export function InlineBulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkTag,
  onBulkDownload,
  onExitBulkMode,
  allSelected,
  isDownloading = false
}: InlineBulkActionsProps) {
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<TagData[]>([])
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [isLoadingTags, setIsLoadingTags] = useState(false)

  // Fetch available tags when dialog opens
  useEffect(() => {
    if (tagDialogOpen) {
      fetchAvailableTags()
    }
  }, [tagDialogOpen])

  const fetchAvailableTags = async () => {
    setIsLoadingTags(true)
    try {
      const response = await fetch('/api/tags/stats')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.stats || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoadingTags(false)
    }
  }

  const handleTag = () => {
    if (selectedTags.length === 0) return
    
    onBulkTag(selectedTags, tagAction)
    setTagDialogOpen(false)
    setSelectedTags([])
  }

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName])
    }
    setTagPopoverOpen(false)
    setNewTagName('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleCreateNewTag = () => {
    const trimmedName = newTagName.trim()
    if (trimmedName && !selectedTags.includes(trimmedName)) {
      setSelectedTags([...selectedTags, trimmedName])
    }
    setTagPopoverOpen(false)
    setNewTagName('')
  }

  const resetTagDialog = () => {
    setSelectedTags([])
    setNewTagName('')
    setTagPopoverOpen(false)
  }

  const handleDeleteConfirm = () => {
    onBulkDelete()
    setDeleteDialogOpen(false)
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="flex items-center justify-between bg-muted/30 border rounded-lg px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="h-7 px-2 text-xs"
          >
            {allSelected ? (
              <CheckSquare className="h-3 w-3 mr-1" />
            ) : (
              <Square className="h-3 w-3 mr-1" />
            )}
            {allSelected ? 'Deselect All' : `Select All`}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagDialogOpen(true)}
            className="h-7"
          >
            <Tag className="h-3 w-3 mr-1" />
            Tag
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDownload}
            disabled={isDownloading}
            className="h-7"
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? 'Creating...' : 'Download'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onExitBulkMode}
            className="h-7"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Bulk Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={(open) => {
        setTagDialogOpen(open)
        if (!open) resetTagDialog()
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Tag Management</DialogTitle>
            <DialogDescription>
              {tagAction === 'add' ? 'Add tags to' : 'Remove tags from'} {selectedCount} selected files
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={tagAction} onValueChange={(value: 'add' | 'remove') => setTagAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Tags</SelectItem>
                  <SelectItem value="remove">Remove Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <ColoredTagPills
                    selectedTags={selectedTags}
                    onRemoveTag={handleRemoveTag}
                  />
                </div>
              )}
              
              {/* Tag Selector */}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Add tags...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search tags or create new..."
                      value={newTagName}
                      onValueChange={setNewTagName}
                    />
                    <CommandEmpty>
                      {newTagName.trim() ? (
                        <div className="p-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={handleCreateNewTag}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create "{newTagName.trim()}"
                          </Button>
                        </div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          {isLoadingTags ? 'Loading tags...' : 'No tags found'}
                        </p>
                      )}
                    </CommandEmpty>
                    {!isLoadingTags && availableTags.length > 0 && (
                      <>
                        <CommandGroup heading="Available Tags">
                          {availableTags
                            .filter(tag => 
                              !selectedTags.includes(tag.name) &&
                              (newTagName === '' || tag.name.toLowerCase().includes(newTagName.toLowerCase()))
                            )
                            .map(tag => (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => handleTagSelect(tag.name)}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full border" 
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span>{tag.name}</span>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {tag.category}
                                  </Badge>
                                  {tag.count > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {tag.count}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Check className="h-4 w-4 opacity-0" />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {newTagName.trim() && !availableTags.some(tag => 
                          tag.name.toLowerCase() === newTagName.toLowerCase()
                        ) && (
                          <>
                            <CommandSeparator />
                            <CommandGroup>
                              <CommandItem onSelect={handleCreateNewTag}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create "{newTagName.trim()}"
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                      </>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTag} disabled={selectedTags.length === 0}>
              {tagAction === 'add' ? 'Add' : 'Remove'} Tags ({selectedTags.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} selected file{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              Warning: This will permanently delete the selected files from storage.
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete {selectedCount} File{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}