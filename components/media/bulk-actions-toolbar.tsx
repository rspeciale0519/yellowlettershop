"use client"

import React, { useState } from 'react'
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
  Trash2,
  Tag,
  Download,
  X,
  CheckSquare,
  Square,
} from "lucide-react"

interface BulkActionsToolbarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkDelete: () => void
  onBulkTag: (tags: string[], action: 'add' | 'remove') => void
  onBulkDownload: () => void
  allSelected: boolean
}


export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkTag,
  onBulkDownload,
  allSelected
}: BulkActionsToolbarProps) {
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add')
  const [tagValue, setTagValue] = useState('')


  const handleTag = () => {
    if (!tagValue.trim()) return
    
    const tags = tagValue.split(',').map(t => t.trim()).filter(Boolean)
    onBulkTag(tags, tagAction)
    setTagDialogOpen(false)
    setTagValue('')
  }

  const handleDelete = () => {
    onBulkDelete()
    setDeleteDialogOpen(false)
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount} of {totalCount} selected
            </Badge>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="h-8"
              >
                {allSelected ? (
                  <><CheckSquare className="h-4 w-4 mr-1" /> Deselect All</>
                ) : (
                  <><Square className="h-4 w-4 mr-1" /> Select All</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagDialogOpen(true)}
              className="h-8"
            >
              <Tag className="h-4 w-4 mr-1" />
              Tags
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDownload}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>


      {/* Bulk Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
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
              <Label htmlFor="tag-value">Tags (comma separated)</Label>
              <Input
                id="tag-value"
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                placeholder="marketing, logo, property"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTag} disabled={!tagValue.trim()}>
              {tagAction === 'add' ? 'Add' : 'Remove'} Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} selected files? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete {selectedCount} Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}