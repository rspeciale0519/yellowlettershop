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
  Trash2,
  X
} from "lucide-react"

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  assets: UserAsset[]
  onConfirm: () => void
  formatFileSize: (size: number) => string
  onRemoveAsset?: (assetId: string) => void
}

export function BulkDeleteConfirmDialog({
  isOpen,
  onClose,
  assets,
  onConfirm,
  formatFileSize,
  onRemoveAsset
}: BulkDeleteConfirmDialogProps) {
  if (!assets || assets.length === 0) return null

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-4 w-4 text-blue-500" />
      case "pdf":
        return <FilePdf className="h-4 w-4 text-red-500" />
      case "document":
        return <FileText className="h-4 w-4 text-green-500" />
      case "spreadsheet":
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const totalSize = assets.reduce((sum, asset) => sum + asset.file_size, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete {assets.length} File{assets.length !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {assets.length} file{assets.length !== 1 ? 's' : ''}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total files:</span>
              <span>{assets.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total size:</span>
              <span>{formatFileSize(totalSize)}</span>
            </div>
          </div>

          {/* File list (max 5 shown) */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {assets.slice(0, 5).map((asset) => (
              <div key={asset.id} className={`flex items-center gap-3 p-2 bg-muted rounded text-sm ${assets.length > 3 ? 'mr-2' : ''}`}>
                <div className="flex-shrink-0">
                  {asset.file_type === "image" ? (
                    <div className="w-8 h-8 rounded overflow-hidden bg-muted-foreground/10">
                      <img
                        src={asset.file_url || "/placeholder.svg"}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const imgElement = e.target as HTMLImageElement;
                          const container = imgElement.parentElement;
                          if (container) {
                            container.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted-foreground/10 flex items-center justify-center">
                      {getFileIcon(asset.file_type)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium break-words text-sm leading-tight">{asset.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(asset.file_size)}
                  </p>
                </div>

                {onRemoveAsset && (
                  <button
                    onClick={() => onRemoveAsset(asset.id)}
                    className="flex-shrink-0 p-1 rounded-sm hover:bg-muted-foreground/20 transition-colors"
                    title="Remove from deletion"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            ))}
            {assets.length > 5 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                ... and {assets.length - 5} more file{assets.length - 5 !== 1 ? 's' : ''}
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
            Delete {assets.length} File{assets.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}