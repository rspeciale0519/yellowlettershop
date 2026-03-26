"use client"

import { useState, useEffect } from "react"
import { useAssets } from "@/hooks/use-assets"
import { Grid, List, CheckSquare, Square, Trash2, Download, Tag, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import JSZip from 'jszip'

import { MediaGrid } from "./media-grid"
import { MediaList } from "./media-list" 
import { MediaUploadDialog } from "./media-upload-dialog"
import { MediaFilters } from "./media-filters"
import { MediaStats } from "./media-stats"
import { ImagePreviewModal } from "./image-preview-modal"
import { FileDetailsModal } from "./file-details-modal"
import { RenameFileModal } from "./rename-file-modal"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { BulkDeleteConfirmDialog } from "./bulk-delete-confirm-dialog"
import { TagsModal } from "./tags-modal"
import { UnifiedSearchBar } from "./unified-search-bar"
import { Pagination } from "./pagination"
import { toast } from "sonner"
import { ensureTagsExist } from "@/lib/tag-manager/tag-utils"

export default function MediaPageContent() {
  const {
    assets: mediaFiles,
    stats,
    isUploading,
    getAssets,
    uploadAsset,
    uploadMultipleAssets,
    deleteAsset,
    updateAsset,
    formatFileSize,
    getAssetStats,
    getSignedUrl
  } = useAssets()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<string[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [assetForAction, setAssetForAction] = useState<any>(null)
  const [isCustomUploading, setIsCustomUploading] = useState(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)
  const [tagsModalOpen, setTagsModalOpen] = useState(false)
  const [tagsModalAssets, setTagsModalAssets] = useState<any[]>([])
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('large')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  // Load assets and stats on mount
  useEffect(() => {
    getAssets()
    getAssetStats()
  }, [getAssets, getAssetStats])

  // Parse unified search query to extract file search and tags
  const parseUnifiedSearch = (query: string) => {
    const tagPattern = /#([^\s]+)/g
    const tags: string[] = []
    let match

    while ((match = tagPattern.exec(query)) !== null) {
      tags.push(match[1].toLowerCase())
    }

    const fileSearchTerm = query.replace(/#[^\s]+/g, '').trim()
    return { tags, fileSearchTerm }
  }

  // Calculate stats from current media files
  const getCalculatedStats = () => {
    if (!mediaFiles || mediaFiles.length === 0) {
      return {
        totalFiles: 0,
        totalSize: '0 Bytes',
        imageCount: 0,
        documentCount: 0,
        pdfCount: 0,
        spreadsheetCount: 0,
        fontCount: 0
      }
    }

    const imageCount = mediaFiles.filter(file => file.file_type === 'image').length
    const documentCount = mediaFiles.filter(file => file.file_type === 'document').length
    const pdfCount = mediaFiles.filter(file =>
      file.file_type === 'pdf' ||
      file.mime_type?.includes('pdf') ||
      file.filename.toLowerCase().endsWith('.pdf')
    ).length
    const spreadsheetCount = mediaFiles.filter(file =>
      file.file_type === 'spreadsheet' ||
      file.mime_type?.includes('spreadsheet') ||
      file.mime_type?.includes('excel') ||
      file.filename.toLowerCase().match(/\.(xlsx?|csv|ods)$/)
    ).length
    const fontCount = mediaFiles.filter(file =>
      file.file_type === 'font' ||
      file.mime_type?.includes('font') ||
      file.filename.toLowerCase().match(/\.(ttf|otf|woff|woff2|eot)$/)
    ).length

    const totalSize = mediaFiles.reduce((sum, file) => sum + (file.file_size || 0), 0)

    return {
      totalFiles: mediaFiles.length,
      totalSize: formatFileSize(totalSize),
      imageCount,
      documentCount,
      pdfCount,
      spreadsheetCount,
      fontCount
    }
  }

  // Handle stats card clicks for filtering
  const handleStatsCardClick = (type: string) => {
    if (type === 'all') {
      setSelectedType('all')
    } else if (type === 'image') {
      setSelectedType('image')
    } else if (type === 'document') {
      setSelectedType('document')
    } else if (type === 'pdf') {
      setSelectedType('pdf')
    } else if (type === 'spreadsheet') {
      setSelectedType('spreadsheet')
    } else if (type === 'font') {
      setSelectedType('font')
    }
  }

  // Filter media files - ensure mediaFiles is defined
  const filteredMediaFiles = (mediaFiles || []).filter((file) => {
    const { tags: searchTags, fileSearchTerm } = parseUnifiedSearch(searchQuery)

    // File name search
    const matchesSearch = !fileSearchTerm || file.filename.toLowerCase().includes(fileSearchTerm.toLowerCase())

    // File type filter
    const matchesType = selectedType === "all" || file.file_type === selectedType

    // Combined tag filter logic (tags from search query + selected tags filter)
    // Filter out empty tags that might result from typing just '#'
    const validSearchTags = searchTags.filter(tag => tag.trim().length > 0)
    const fileTags = (file.metadata?.tags || []).map((tag: string) => tag.toLowerCase())
    const allFilterTags = [...new Set([...selectedTagsFilter, ...validSearchTags])]
    const matchesTagsFilter = allFilterTags.length === 0 ||
      allFilterTags.every((tag) => tag.trim().length > 0 && fileTags.includes(tag.toLowerCase()))

    return matchesSearch && matchesType && matchesTagsFilter
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredMediaFiles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFiles = filteredMediaFiles.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedType, selectedTagsFilter])

  // Asset action handlers
  const handleImageClick = async (asset: any) => {
    try {
      // For images, show in modal; for other files, download or open in new tab
      if (asset.file_type === 'image') {
        // Get signed URL and set it to the asset for display
        const signedUrl = await getSignedUrl(asset.id)
        const assetWithSignedUrl = { ...asset, file_url: signedUrl }
        setSelectedAsset(assetWithSignedUrl)
        
        // Find the index of this asset in the filtered list
        const index = filteredMediaFiles.findIndex(file => file.id === asset.id)
        setCurrentAssetIndex(index)
        setPreviewModalOpen(true)
      } else {
        // For non-images, download or open in new tab
        const signedUrl = await getSignedUrl(asset.id)
        window.open(signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Error opening asset:', error)
    }
  }

  const handleDeleteClick = async (asset: any) => {
    // Set the asset for deletion and open the confirmation modal
    setAssetForAction(asset)
    setDeleteModalOpen(true)
  }

  // Handle the actual deletion after modal confirmation
  const handleConfirmDelete = async () => {
    if (!assetForAction) return
    
    try {
      await deleteAsset(assetForAction.id)
      toast.success('File deleted successfully')
      // Refresh the assets list
      getAssets()
      // Close the modal
      setDeleteModalOpen(false)
      setAssetForAction(null)
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('Failed to delete file')
    }
  }

  const handleShowDetails = async (asset: any) => {
    try {
      // Get signed URL for the asset to display in details
      const signedUrl = await getSignedUrl(asset.id)
      const assetWithSignedUrl = { ...asset, file_url: signedUrl }
      setAssetForAction(assetWithSignedUrl)
      setDetailsModalOpen(true)
    } catch (error) {
      console.error('Error loading asset details:', error)
      toast.error('Failed to load asset details')
    }
  }

  const handleOpenRenameModal = (asset: any) => {
    setAssetForAction(asset)
    setRenameModalOpen(true)
  }

  // Modal navigation handler
  const handleModalNavigate = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentAssetIndex - 1 : currentAssetIndex + 1
    if (newIndex >= 0 && newIndex < filteredMediaFiles.length) {
      const newAsset = filteredMediaFiles[newIndex]
      try {
        const signedUrl = await getSignedUrl(newAsset.id)
        const assetWithSignedUrl = { ...newAsset, file_url: signedUrl }
        setSelectedAsset(assetWithSignedUrl)
        setCurrentAssetIndex(newIndex)
      } catch (error) {
        console.error('Error loading next asset:', error)
      }
    }
  }

  // File Details Modal handlers
  const handleDownload = async (asset: any) => {
    if (!asset.file_path) {
      toast.error('File path not available for download')
      return
    }

    try {
      const signedUrl = await getSignedUrl(asset.id, 3600)

      // Fetch the file as a blob to ensure it downloads rather than opening
      const response = await fetch(signedUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = asset.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl)

      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading asset:', error)
      toast.error('Failed to download file')
    }
  }

  const handleCopyLink = async (asset: any) => {
    try {
      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: asset.id,
          expiresInDays: 30 // 30 day expiration for shared links
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate share link')
      }
      
      const { shareUrl } = await response.json()
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Failed to copy link. Please try again.')
    }
  }

  // Rename Modal handler
  const handleRenameSubmit = async (asset: any, newName: string) => {
    try {
      await updateAsset(asset.id, { name: newName })
      toast.success('File renamed successfully')
      // Refresh the assets list
      getAssets()
    } catch (error) {
      console.error('Error renaming asset:', error)
      throw error // Re-throw so the modal can handle it
    }
  }

  // Upload with progress support using XMLHttpRequest
  const uploadMultipleAssetsWithProgress = async (
    files: File[],
    commonOptions: { tags?: string[] } = {},
    onProgress?: (progress: number) => void
  ) => {
    const uploadFile = (file: File, index: number, total: number): Promise<any> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData()
        formData.append('file', file)

        if (commonOptions.tags) formData.append('tags', commonOptions.tags.join(','))

        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const fileProgress = (event.loaded / event.total) * 100
            const totalProgress = ((index * 100) + fileProgress) / total
            onProgress(totalProgress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve(result)
            } catch (error) {
              reject(new Error('Invalid response format'))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.error || 'Upload failed'))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'))
        })

        xhr.open('POST', '/api/assets')
        xhr.send(formData)
      })
    }

    const results = []
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadFile(files[i], i, files.length)
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload file ${files[i].name}:`, error)
        // Continue with other files even if one fails
      }
    }

    return results
  }

  // Upload handler that matches MediaUploadDialog's expected signature
  const handleUpload = async (files: File[], tags: string[], onProgress?: (progress: number) => void) => {
    setIsCustomUploading(true)
    try {
      console.log('MediaPageContent handleUpload called with:', {
        filesCount: files.length,
        tags,
        firstFile: files[0] ? {
          name: files[0].name,
          type: files[0].type,
          size: files[0].size
        } : null
      })

      // Ensure all tags exist in Tag Manager before uploading
      if (tags.length > 0) {
        try {
          await ensureTagsExist(tags)
        } catch (error) {
          console.error('Error ensuring tags exist:', error)
          // Continue with upload even if tag creation fails
        }
      }

      const results = await uploadMultipleAssetsWithProgress(files, { tags }, onProgress)

      if (results.length > 0) {
        toast.success(`Successfully uploaded ${results.length} file${results.length !== 1 ? 's' : ''}`)
      }

      // Always refresh the assets list after upload attempt, regardless of success/failure
      await getAssets()
    } catch (error) {
      console.error('Upload error in MediaPageContent:', error)
      // Still refresh assets in case some uploads succeeded
      try {
        await getAssets()
      } catch (refreshError) {
        console.error('Error refreshing assets after upload error:', refreshError)
      }
      throw error
    } finally {
      setIsCustomUploading(false)
    }
  }

  // Bulk select handlers
  const handleFileSelect = (fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredMediaFiles.length) {
      // Deselect all
      setSelectedFiles(new Set())
    } else {
      // Select all
      setSelectedFiles(new Set(filteredMediaFiles.map(file => file.id)))
    }
  }

  const handleBulkDelete = () => {
    if (selectedFiles.size === 0) return
    setBulkDeleteModalOpen(true)
  }

  const handleConfirmBulkDelete = async () => {
    if (selectedFiles.size === 0) return

    try {
      await Promise.all(Array.from(selectedFiles).map(fileId => deleteAsset(fileId)))
      toast.success(`Deleted ${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''}`)
      setSelectedFiles(new Set())
      setBulkDeleteModalOpen(false)
      await getAssets()
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete some files')
    }
  }

  const handleRemoveFromBulkDelete = (assetId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(assetId)

      // Close the modal if no files are left to delete
      if (newSet.size === 0) {
        setBulkDeleteModalOpen(false)
      }

      return newSet
    })
  }

  const toggleBulkSelectMode = () => {
    setBulkSelectMode(!bulkSelectMode)
    setSelectedFiles(new Set()) // Clear selections when toggling
  }

  const handleBulkTags = () => {
    const selectedAssets = filteredMediaFiles.filter(file => selectedFiles.has(file.id))
    setTagsModalAssets(selectedAssets)
    setTagsModalOpen(true)
  }

  const handleManageTags = (asset: any) => {
    setTagsModalAssets([asset])
    setTagsModalOpen(true)
  }

  // Tag filter handlers
  const handleTagFilterToggle = (tag: string) => {
    setSelectedTagsFilter(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClearTagFilters = () => {
    setSelectedTagsFilter([])
  }

  const handleClearAllFilters = () => {
    setSearchQuery('')
    setSelectedTagsFilter([])
  }

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) return

    setIsDownloadingZip(true)
    try {
      const zip = new JSZip()
      const selectedAssets = filteredMediaFiles.filter(file => selectedFiles.has(file.id))

      // Download all files and add to zip
      for (let i = 0; i < selectedAssets.length; i++) {
        const asset = selectedAssets[i]
        try {
          const signedUrl = await getSignedUrl(asset.id, 3600)
          const response = await fetch(signedUrl)

          if (!response.ok) {
            console.error(`Failed to download ${asset.filename}`)
            continue
          }

          const blob = await response.blob()

          // Add file to zip with original filename
          zip.file(asset.filename, blob)

          // Show progress
          toast.success(`Added ${i + 1} of ${selectedAssets.length} files to zip`)
        } catch (error) {
          console.error(`Error downloading ${asset.filename}:`, error)
        }
      }

      // Generate zip file
      toast.success('Creating zip file...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Create download link
      const zipUrl = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = zipUrl
      link.download = `media-files-${new Date().toISOString().split('T')[0]}.zip`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      URL.revokeObjectURL(zipUrl)

      toast.success(`Downloaded ${selectedAssets.length} files as zip`)
    } catch (error) {
      console.error('Bulk download error:', error)
      toast.error('Failed to create zip file')
    } finally {
      setIsDownloadingZip(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="space-y-4">
          {/* Header */}
          <h1 className="text-3xl font-bold">Media Library</h1>

          <MediaStats
            stats={getCalculatedStats()}
            onFilterByType={handleStatsCardClick}
          />

          {/* Compact Toolbar */}
          <div className="flex items-start gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-0 max-w-lg">
              <UnifiedSearchBar
                searchQuery={searchQuery}
                selectedTags={selectedTagsFilter}
                onSearchChange={setSearchQuery}
                onTagToggle={handleTagFilterToggle}
                onClearAll={handleClearAllFilters}
                mediaFiles={mediaFiles || []}
              />
            </div>

            {/* Toolbar Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Select Toggle */}
              <Button
                variant={bulkSelectMode ? "default" : "outline"}
                size="sm"
                onClick={toggleBulkSelectMode}
              >
                {bulkSelectMode ? <CheckSquare className="h-4 w-4 mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                {bulkSelectMode ? "Exit Select" : "Select"}
              </Button>

              {/* Upload Button */}
              <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                Upload Files
              </Button>

              {/* File Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="File type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                  <SelectItem value="font">Fonts</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Thumbnail Size Selector */}
              <Select value={thumbnailSize} onValueChange={(value: 'small' | 'medium' | 'large') => setThumbnailSize(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none border-r"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {bulkSelectMode && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedFiles.size === filteredMediaFiles.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedFiles.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    Clear Selection
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.size} of {filteredMediaFiles.length} files selected
                </span>
              </div>
              {selectedFiles.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDownload}
                    disabled={isDownloadingZip}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloadingZip ? 'Creating Zip...' : 'Download Selected'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkTags}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Media Content */}
      <div className="space-y-6">
        {viewMode === "grid" ? (
          <MediaGrid
            filteredMediaFiles={paginatedFiles}
            newlyUploadedIds={new Set()}
            formatFileSize={formatFileSize}
            handleImageClick={handleImageClick}
            handleDeleteClick={handleDeleteClick}
            handleShowDetails={handleShowDetails}
            handleOpenRenameModal={handleOpenRenameModal}
            handleManageTags={handleManageTags}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            bulkSelectMode={bulkSelectMode}
            thumbnailSize={thumbnailSize}
          />
        ) : (
          <MediaList
            files={paginatedFiles}
            onFileSelect={(asset) => handleImageClick(asset)}
            onFileDelete={(asset) => handleDeleteClick(asset)}
            onFileUpdate={updateAsset}
            formatFileSize={formatFileSize}
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredMediaFiles.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items)
            setCurrentPage(1) // Reset to first page when changing items per page
          }}
        />
      </div>

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isCustomUploading}
      />

      <ImagePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        asset={selectedAsset}
        allAssets={filteredMediaFiles}
        currentIndex={currentAssetIndex}
        onNavigate={handleModalNavigate}
      />

      <FileDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        asset={assetForAction}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
      />

      <RenameFileModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        asset={assetForAction}
        onSubmit={handleRenameSubmit}
      />

      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setAssetForAction(null)
        }}
        asset={assetForAction}
        onConfirm={handleConfirmDelete}
        formatFileSize={formatFileSize}
      />

      <TagsModal
        isOpen={tagsModalOpen}
        onClose={() => setTagsModalOpen(false)}
        assets={tagsModalAssets}
        onTagsUpdate={getAssets}
        allMediaFiles={mediaFiles}
      />

      <BulkDeleteConfirmDialog
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        assets={filteredMediaFiles.filter(file => selectedFiles.has(file.id))}
        onConfirm={handleConfirmBulkDelete}
        formatFileSize={formatFileSize}
        onRemoveAsset={handleRemoveFromBulkDelete}
      />
    </div>
  )
}