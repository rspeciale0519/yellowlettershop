"use client"

import React, { useMemo } from 'react'
import { Grid } from 'react-window'
import { Card, CardContent } from "@/components/ui/card"
import { FileActions } from "./file-actions"
import { UserAsset } from '@/types/supabase'
import { getThumbnailGridClass, getThumbnailImageClass, ThumbnailSize } from './thumbnail-controls'
import {
  FileImage,
  FileText,
  File,
  FileIcon as FilePdf,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface VirtualizedMediaGridProps {
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
  thumbnailSize: ThumbnailSize
  containerHeight: number
  containerWidth: number
}

const GRID_COLUMNS = {
  small: { desktop: 6, tablet: 4, mobile: 2 },
  medium: { desktop: 4, tablet: 3, mobile: 2 },
  large: { desktop: 3, tablet: 2, mobile: 1 }
}

const ITEM_HEIGHTS = {
  small: 200,
  medium: 250,
  large: 300
}

export function VirtualizedMediaGrid({
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
  thumbnailSize,
  containerHeight,
  containerWidth
}: VirtualizedMediaGridProps) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-8 w-8 text-blue-500" />
      case "pdf":
        return <FilePdf className="h-8 w-8 text-red-500" />
      case "document":
        return <FileText className="h-8 w-8 text-green-500" />
      case "spreadsheet":
        return <FileText className="h-8 w-8 text-green-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  // Calculate grid dimensions based on container width and thumbnail size
  const { columnCount, columnWidth } = useMemo(() => {
    const columns = containerWidth >= 1024 
      ? GRID_COLUMNS[thumbnailSize].desktop
      : containerWidth >= 768 
      ? GRID_COLUMNS[thumbnailSize].tablet
      : GRID_COLUMNS[thumbnailSize].mobile

    const gap = 24 // 1.5rem gap
    const availableWidth = containerWidth - (gap * (columns - 1))
    const width = Math.floor(availableWidth / columns)

    return {
      columnCount: columns,
      columnWidth: width
    }
  }, [containerWidth, thumbnailSize])

  const rowHeight = ITEM_HEIGHTS[thumbnailSize]
  const rowCount = Math.ceil(filteredMediaFiles.length / columnCount)

  // Grid item renderer
  const GridItem = ({ columnIndex, rowIndex, style }: any) => {
    const itemIndex = rowIndex * columnCount + columnIndex
    const file = filteredMediaFiles[itemIndex]

    if (!file) {
      return <div style={style} />
    }

    const isNewlyUploaded = newlyUploadedIds.has(file.id)
    const isSelected = selectedFiles.has(file.id)
    const imageClass = getThumbnailImageClass(thumbnailSize)

    return (
      <div style={style} className="p-3">
        <Card 
          className={`overflow-hidden transition-all duration-1000 ${
            isNewlyUploaded 
              ? "ring-1 ring-[#F6CF62] shadow-lg shadow-[#F6CF62]/20 animate-gentle-pulse" 
              : isSelected
              ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/20"
              : ""
          }`}
        >
          <div className={`relative bg-muted cursor-pointer ${imageClass}`}>
            {/* Bulk select checkbox */}
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
            
            <div
              onClick={() => {
                if (bulkSelectMode) {
                  onFileSelect(file.id, !isSelected)
                } else {
                  handleImageClick(file)
                }
              }}
              className="w-full h-full"
            >
              {file.file_type === "image" ? (
                <img
                  src={file.file_url || "/placeholder.svg"}
                  alt={file.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const imgElement = e.target as HTMLImageElement;
                    const container = imgElement.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="flex h-full w-full items-center justify-center">
                          <svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
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
              <div className="absolute right-2 top-2">
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
          <CardContent className="p-3">
            <div className="space-y-1">
              <h3 className="font-semibold truncate text-sm" title={file.filename}>
                {file.filename}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatFileSize(file.file_size)}</span>
                <span>{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (filteredMediaFiles.length === 0) {
    return null
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={containerWidth}
    >
      {GridItem}
    </Grid>
  )
}