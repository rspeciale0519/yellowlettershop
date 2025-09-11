"use client"

import React, { useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileActions } from "./file-actions"
import { UserAsset } from '@/types/supabase'
import { Checkbox } from "@/components/ui/checkbox"
import {
  FileImage,
  FileText,
  File,
  FileIcon as FilePdf,
} from "lucide-react"

interface EnhancedMediaGridProps {
  filteredMediaFiles: UserAsset[]
  newlyUploadedIds: Set<string>
  formatFileSize: (size: number) => string
  handleImageClick: (asset: any) => void
  handleDeleteClick: (asset: any) => void
  handleShowDetails: (asset: any) => void
  handleOpenRenameModal: (asset: any) => void
  selectedFiles: Set<string>
  onFileSelect: (fileId: string, selected: boolean) => void
  bulkSelectMode: boolean
  onItemRegister?: (id: string, element: HTMLElement) => (() => void) | void
  lastClickedIndex: number | null
  onItemClick: (fileId: string, index: number, event: React.MouseEvent) => void
}

export function EnhancedMediaGrid({
  filteredMediaFiles,
  newlyUploadedIds,
  formatFileSize,
  handleImageClick,
  handleDeleteClick,
  handleShowDetails,
  handleOpenRenameModal,
  selectedFiles,
  onFileSelect,
  bulkSelectMode,
  onItemRegister,
  lastClickedIndex,
  onItemClick
}: EnhancedMediaGridProps) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

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

  const registerItemRef = useCallback((fileId: string, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(fileId, element)
      return onItemRegister?.(fileId, element)
    } else {
      itemRefs.current.delete(fileId)
    }
  }, [onItemRegister])

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredMediaFiles.map((file, index) => {
        const isNewlyUploaded = newlyUploadedIds.has(file.id)
        const isSelected = selectedFiles.has(file.id)
        
        return (
        <Card 
          key={file.id} 
          ref={(el) => registerItemRef(file.id, el)}
          className={`group overflow-hidden transition-all duration-200 cursor-pointer ${
            isNewlyUploaded 
              ? "ring-1 ring-[#F6CF62] shadow-lg shadow-[#F6CF62]/20 animate-gentle-pulse" 
              : isSelected
              ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 bg-blue-50/50"
              : "hover:shadow-md"
          }`}
          onClick={(e) => onItemClick(file.id, index, e)}
        >
          <div className="relative aspect-[3/2] bg-muted">
            {/* Selection indicator - always visible in bulk mode, hidden otherwise */}
            {bulkSelectMode && (
              <div 
                className="absolute top-2 left-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={(checked) => onFileSelect(file.id, checked as boolean)}
                />
              </div>
            )}
            
            {/* Visual selection indicator for non-bulk mode */}
            {!bulkSelectMode && isSelected && (
              <div className="absolute top-2 left-2 z-10 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
            )}
            
            <div className="w-full h-full">
              {file.file_type === "image" ? (
                <img
                  src={file.file_url || "/placeholder.svg"}
                  alt={file.filename}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const imgElement = e.target as HTMLImageElement;
                    const container = imgElement.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="flex h-full w-full items-center justify-center">
                          <svg class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{getFileIcon(file.file_type)}</div>
              )}
            </div>
            
            {!bulkSelectMode && (
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <FileActions
                  asset={file}
                  onDelete={handleDeleteClick}
                  onShowDetails={handleShowDetails}
                  onRename={() => {}}
                  onOpenRenameModal={handleOpenRenameModal}
                />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold truncate" title={file.filename}>
                {file.filename}
              </h3>
              
              {/* Tags */}
              {file.metadata?.tags && file.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {file.metadata.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  {file.metadata.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      +{file.metadata.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatFileSize(file.file_size)}</span>
                <span>{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}