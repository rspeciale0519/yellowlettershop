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
import { UserAsset } from '@/types/supabase'
import {
  FileImage,
  FileText,
  File,
  FileIcon as FilePdf,
} from "lucide-react"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  asset: UserAsset | null
  onConfirm: () => void
  formatFileSize: (size: number) => string
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  asset,
  onConfirm,
  formatFileSize
}: DeleteConfirmDialogProps) {
  if (!asset) return null

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-6 w-6 text-blue-500" />
      case "pdf":
        return <FilePdf className="h-6 w-6 text-red-500" />
      case "document":
        return <FileText className="h-6 w-6 text-green-500" />
      case "spreadsheet":
        return <FileText className="h-6 w-6 text-green-500" />
      default:
        return <File className="h-6 w-6 text-gray-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete File</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this file? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="w-12 h-12 rounded bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
            {asset.file_type === "image" ? (
              <img
                src={asset.file_url || "/placeholder.svg"}
                alt={asset.filename}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement;
                  const container = imgElement.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <svg class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                      </svg>
                    `;
                  }
                }}
              />
            ) : (
              getFileIcon(asset.file_type)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{asset.filename}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(asset.file_size)} • {new Date(asset.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}