"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAssets } from "@/hooks/use-assets"
import { EnhancedFilterBar, InlineBulkActions } from "@/components/media"
import { MediaHeader } from "@/components/media/media-header"
import { MediaBrowser } from "@/components/media/media-browser"
import { MediaDialogs } from "@/components/media/media-dialogs"
import { useMediaSelection } from "@/hooks/use-media-selection"
import { useMediaBulkActions } from "@/hooks/use-media-bulk-actions"
import { useMediaModals } from "@/hooks/use-media-modals"
import { useMediaShortcuts } from "@/hooks/use-media-shortcuts"

export default function MediaPageContent() {
  const {
    assets: mediaFiles,
    isUploading,
    getAssets,
    uploadMultipleAssets,
    deleteAsset,
    updateAsset,
    formatFileSize,
    getAssetStats,
  } = useAssets()

  // View/filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [preSelectedFiles, setPreSelectedFiles] = useState<File[]>([])

  // Load assets
  useEffect(() => {
    getAssets()
    getAssetStats()
  }, [getAssets, getAssetStats])

  // Derived
  const filteredMediaFiles = useMemo(() => {
    return mediaFiles.filter((file) => {
      const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === "all" || file.file_type === selectedType
      const fileTags = file.metadata?.tags || []
      const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => fileTags.includes(tag))
      return matchesSearch && matchesType && matchesTags
    })
  }, [mediaFiles, searchQuery, selectedType, selectedTags])

  // Selection + bulk actions
  const sel = useMediaSelection(filteredMediaFiles as any)
  const { isDownloading, handleBulkDelete, handleBulkTag, handleBulkDownload } = useMediaBulkActions({
    selectedFiles: sel.selectedFiles,
    setSelectedFiles: sel.setSelectedFiles,
    setBulkSelectMode: sel.setBulkSelectMode,
    mediaFiles,
    deleteAsset,
    updateAsset,
    getAssets,
    getAssetStats,
  })

  // Modals state
  const modals = useMediaModals(filteredMediaFiles as any, updateAsset as any, getAssets)
  const [newlyUploadedIds, setNewlyUploadedIds] = useState<Set<string>>(new Set())

  // Shortcuts
  useMediaShortcuts({
    bulkSelectMode: sel.bulkSelectMode,
    handleSelectAll: () => {
      sel.setBulkSelectMode(true)
      sel.handleSelectAll()
    },
    handleDeselectAll: sel.handleDeselectAll,
    handleBulkDelete: sel.selectedFiles.size > 0 ? handleBulkDelete : undefined,
    exitBulkMode: () => {
      sel.setBulkSelectMode(false)
      sel.setSelectedFiles(new Set())
      sel.setLastClickedIndex(null)
    },
  })

  // File validation (reused from upload dialog)
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`
    }
    
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/rtf',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has an unsupported format. Please use images, PDFs, documents, or spreadsheets.`
    }
    
    return null
  }

  // Upload handling
  const handleUpload = useCallback(async (files: File[], tags: string[]) => {
    try {
      const uploaded = await uploadMultipleAssets(files, { tags })
      if (uploaded.length > 0) {
        const ids = new Set(uploaded.map(u => u.id))
        setNewlyUploadedIds(ids)
        setTimeout(() => setNewlyUploadedIds(new Set()), 3000)
      }
      await getAssets()
      await getAssetStats()
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Some files failed to upload")
    }
  }, [uploadMultipleAssets, getAssets, getAssetStats])

  // Handle files selected from empty state - open upload modal
  const handleFilesSelected = useCallback((files: File[]) => {
    const validationErrors: string[] = []
    const validFiles: File[] = []
    
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(error)
      } else {
        validFiles.push(file)
      }
    })
    
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(' '))
    }
    
    // Set pre-selected files and open dialog
    setPreSelectedFiles(validFiles)
    setUploadDialogOpen(true)
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <MediaHeader viewMode={viewMode} setViewMode={setViewMode} onOpenUpload={() => {
        setPreSelectedFiles([])
        setUploadDialogOpen(true)
      }} />

      <EnhancedFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        allFiles={mediaFiles}
        bulkSelectMode={sel.bulkSelectMode}
        toggleBulkSelect={sel.toggleBulkSelect}
        selectedCount={sel.selectedFiles.size}
        totalCount={filteredMediaFiles.length}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
      />

      {sel.bulkSelectMode && sel.selectedFiles.size > 0 && (
        <InlineBulkActions
          selectedCount={sel.selectedFiles.size}
          totalCount={filteredMediaFiles.length}
          onSelectAll={sel.handleSelectAll}
          onDeselectAll={sel.handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkTag={handleBulkTag}
          onBulkDownload={handleBulkDownload}
          isDownloading={isDownloading}
          onExitBulkMode={sel.toggleBulkSelect}
          allSelected={sel.allSelected}
        />
      )}

      <div ref={sel.containerRef} onMouseDown={sel.handleMouseDown} className="relative" style={{ minHeight: '200px' }}>
        {sel.isDragging && sel.dragStyle && <div style={sel.dragStyle} />}
        <MediaBrowser
          viewMode={viewMode}
          filteredMediaFiles={filteredMediaFiles}
          newlyUploadedIds={newlyUploadedIds}
          formatFileSize={formatFileSize}
          handleImageClick={modals.handleImageClick}
          handleDeleteClick={modals.handleDeleteClick}
          handleShowDetails={modals.handleShowDetails}
          handleOpenRenameModal={modals.handleOpenRenameModal}
          selectedFiles={sel.selectedFiles}
          onFileSelect={sel.handleFileSelect}
          bulkSelectMode={sel.bulkSelectMode}
          onItemRegister={sel.registerItem}
          lastClickedIndex={sel.lastClickedIndex}
          onItemClick={sel.handleItemClick}
          onSelectAll={sel.handleSelectAll}
          allSelected={sel.allSelected}
          onFilesSelected={handleFilesSelected}
          isUploading={isUploading}
        />
      </div>

      <MediaDialogs
        uploadOpen={uploadDialogOpen}
        setUploadOpen={setUploadDialogOpen}
        isUploading={isUploading}
        onUpload={handleUpload}
        initialFiles={preSelectedFiles}
        lightboxOpen={modals.lightboxOpen}
        setLightboxOpen={modals.setLightboxOpen}
        lightboxAsset={modals.lightboxAsset}
        lightboxImages={filteredMediaFiles.filter(file => file.file_type === "image")}
        lightboxIndex={modals.lightboxIndex}
        onNavigateImage={modals.handleNavigateImage}
        fileDetailsOpen={modals.fileDetailsOpen}
        setFileDetailsOpen={modals.setFileDetailsOpen}
        selectedFile={modals.selectedFile}
        renameOpen={modals.renameModalOpen}
        setRenameOpen={modals.setRenameModalOpen}
        fileToRename={modals.fileToRename}
        onRename={modals.handleRename}
        deleteOpen={modals.deleteDialogOpen}
        setDeleteOpen={modals.closeDeleteDialog}
        fileToDelete={modals.fileToDelete}
        onConfirmDelete={async () => {
          if (modals.fileToDelete) {
            try {
              await deleteAsset(modals.fileToDelete.id)
              toast.success("File deleted successfully")
              // Close the dialog and clear the file to delete
              modals.closeDeleteDialog()
              await getAssets()
              await getAssetStats()
            } catch (error) {
              console.error("Delete error:", error)
              toast.error("Failed to delete file")
            }
          }
        }}
        formatFileSize={formatFileSize}
      />
    </div>
  )
}

