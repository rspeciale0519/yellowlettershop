"use client"

import { EnhancedMediaGrid } from "@/components/media/enhanced-media-grid"
import { MediaListView } from "@/components/media/media-list-view"

interface MediaBrowserProps {
  viewMode: "grid" | "list"
  filteredMediaFiles: any[]
  newlyUploadedIds: Set<string>
  formatFileSize: (n: number) => string
  handleImageClick: (asset: any) => void
  handleDeleteClick: (asset: any) => void
  handleShowDetails: (asset: any) => void
  handleOpenRenameModal: (asset: any) => void
  selectedFiles: Set<string>
  onFileSelect: (id: string, selected: boolean) => void
  bulkSelectMode: boolean
  onItemRegister: (id: string, el: HTMLElement) => void
  lastClickedIndex: number | null
  onItemClick: (id: string, index: number, e: React.MouseEvent) => void
  onSelectAll: () => void
  allSelected: boolean
}

export function MediaBrowser(props: MediaBrowserProps) {
  const {
    viewMode,
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
    onItemClick,
    onSelectAll,
    allSelected,
  } = props

  if (filteredMediaFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No files found. Try adjusting your filters or upload some files.</p>
      </div>
    )
  }

  return viewMode === "grid" ? (
    <EnhancedMediaGrid
      filteredMediaFiles={filteredMediaFiles}
      newlyUploadedIds={newlyUploadedIds}
      formatFileSize={formatFileSize}
      handleImageClick={handleImageClick}
      handleDeleteClick={handleDeleteClick}
      handleShowDetails={handleShowDetails}
      handleOpenRenameModal={handleOpenRenameModal}
      selectedFiles={selectedFiles}
      onFileSelect={onFileSelect}
      bulkSelectMode={bulkSelectMode}
      onItemRegister={onItemRegister}
      lastClickedIndex={lastClickedIndex}
      onItemClick={onItemClick}
    />
  ) : (
    <MediaListView
      filteredMediaFiles={filteredMediaFiles}
      newlyUploadedIds={newlyUploadedIds}
      formatFileSize={formatFileSize}
      handleImageClick={handleImageClick}
      handleDeleteClick={handleDeleteClick}
      handleShowDetails={handleShowDetails}
      handleOpenRenameModal={handleOpenRenameModal}
      selectedFiles={selectedFiles}
      onFileSelect={onFileSelect}
      bulkSelectMode={bulkSelectMode}
      onSelectAll={onSelectAll}
      allSelected={allSelected}
    />
  )
}

