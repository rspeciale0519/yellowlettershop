"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TagData } from "./tag-form-modal"
import {
  Trash2,
  X,
  Tag,
  AlertTriangle
} from "lucide-react"

interface BulkTagDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  tags: TagData[]
  onConfirm: () => void
  onRemoveTag?: (tagId: string) => void
}

export function BulkTagDeleteModal({
  isOpen,
  onClose,
  tags,
  onConfirm,
  onRemoveTag
}: BulkTagDeleteModalProps) {
  if (!tags || tags.length === 0) return null

  const totalUsage = tags.reduce((sum, tag) => sum + (tag.count || 0), 0)
  const systemTagsCount = tags.filter(tag => tag.is_system).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete {tags.length} Tag{tags.length !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {tags.length} tag{tags.length !== 1 ? 's' : ''}? This action cannot be undone and will remove all tag associations.
            {systemTagsCount > 0 && (
              <span className="block mt-2 text-orange-600 font-medium">
                Note: {systemTagsCount} system tag{systemTagsCount !== 1 ? 's' : ''} will be skipped as they cannot be deleted.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-sm">Impact Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total tags:</span>
                <span>{tags.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total usage:</span>
                <span>{totalUsage} files</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Categories affected:</span>
                <span>{new Set(tags.map(tag => tag.category)).size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Public tags:</span>
                <span>{tags.filter(tag => tag.visibility === 'public').length}</span>
              </div>
              {systemTagsCount > 0 && (
                <div className="flex items-center justify-between text-orange-600">
                  <span className="font-medium">System tags (cannot delete):</span>
                  <span>{systemTagsCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tag list (max 5 shown) */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {tags.slice(0, 5).map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center gap-3 p-2 bg-muted rounded text-sm ${tags.length > 3 ? 'mr-2' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                    style={{ backgroundColor: tag.color, borderColor: tag.color }}
                  >
                    <Tag className="h-3 w-3 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium break-words text-sm leading-tight" style={{ color: tag.color }}>
                      {tag.name}
                    </p>
                    {(tag.count || 0) > 0 && (
                      <Badge
                        className="text-xs text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.count}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {tag.category}
                    </Badge>
                    {tag.is_system && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                        System
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {tag.visibility}
                    </span>
                  </div>
                </div>

                {onRemoveTag && (
                  <button
                    onClick={() => onRemoveTag(tag.id)}
                    className="flex-shrink-0 p-1 rounded-sm hover:bg-muted-foreground/20 transition-colors"
                    title="Remove from deletion"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            ))}
            {tags.length > 5 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                ... and {tags.length - 5} more tag{tags.length - 5 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {tags.length} Tag{tags.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}