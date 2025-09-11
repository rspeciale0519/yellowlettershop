"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"
import { TagData } from "./tag-form-modal"

interface TagDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  tagToDelete: TagData | null
  onConfirm: () => void
}

export function TagDeleteModal({ isOpen, onClose, tagToDelete, onConfirm }: TagDeleteModalProps) {
  if (!tagToDelete) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Tag</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this tag? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="w-12 h-12 rounded bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
            <Tag className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="outline" 
                style={{ backgroundColor: tagToDelete.color + '20', borderColor: tagToDelete.color, color: tagToDelete.color }}
              >
                {tagToDelete.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {tagToDelete.category} • Created {new Date(tagToDelete.created_at).toLocaleDateString()}
            </p>
            {tagToDelete.description && (
              <p className="text-sm text-muted-foreground mt-1">{tagToDelete.description}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}