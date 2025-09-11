"use client"

import React from 'react'
import { FileActions } from "./file-actions"
import { UserAsset } from '@/types/supabase'
import { Badge } from "@/components/ui/badge"
import {
  FileImage,
  FileText,
  File,
  FileIcon as FilePdf,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface MediaListViewProps {
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
  onSelectAll: (selected: boolean) => void
  allSelected: boolean
}

export function MediaListView({
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
  onSelectAll,
  allSelected
}: MediaListViewProps) {
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
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {bulkSelectMode && (
              <th className="px-4 py-3 text-left font-medium w-12">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Tags</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Size</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMediaFiles.map((file) => {
            const isNewlyUploaded = newlyUploadedIds.has(file.id)
            const isSelected = selectedFiles.has(file.id)
            
            return (
            <tr 
              key={file.id} 
              className={`border-b transition-all duration-1000 ${
                isNewlyUploaded 
                  ? "bg-[#F6CF62]/10 ring-1 ring-[#F6CF62]/30 animate-gentle-pulse" 
                  : isSelected
                  ? "bg-blue-50 ring-1 ring-blue-200"
                  : ""
              }`}
            >
              {bulkSelectMode && (
                <td className="px-4 py-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onFileSelect(file.id, !!checked)}
                  />
                </td>
              )}
              <td className="px-4 py-3">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => {
                    if (bulkSelectMode) {
                      onFileSelect(file.id, !isSelected)
                    } else {
                      handleImageClick(file)
                    }
                  }}
                >
                  {getFileIcon(file.file_type)}
                  <span className="font-medium">{file.filename}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {file.metadata?.tags && file.metadata.tags.length > 0 ? (
                    <>
                      {file.metadata.tags.slice(0, 2).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                      {file.metadata.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          +{file.metadata.tags.length - 2}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 capitalize">{file.file_type}</td>
              <td className="px-4 py-3">{formatFileSize(file.file_size)}</td>
              <td className="px-4 py-3">{new Date(file.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right">
                {!bulkSelectMode && (
                  <FileActions
                    asset={file}
                    onDelete={handleDeleteClick}
                    onShowDetails={handleShowDetails}
                    onRename={() => {}}
                    onOpenRenameModal={handleOpenRenameModal}
                  />
                )}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}