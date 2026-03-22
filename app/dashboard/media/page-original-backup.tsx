"use client"

import { useState, useEffect, useCallback } from "react"
import { useAssets } from "@/hooks/use-assets"
import {
  Search,
  Upload,
  Grid,
  List,
  Filter,
  ImageIcon,
  File,
  FileText,
  FileImage,
  FileIcon as FilePdf,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ImagePreviewModal, FileActions, FileDetailsModal, RenameFileModal } from "@/components/media"


export default function MediaPage() {
  const {
    assets: mediaFiles,
    isUploading,
    getAssets,
    uploadAsset,
    deleteAsset,
    updateAsset,
    formatFileSize,
    getAssetStats,
    getSignedUrl
  } = useAssets()

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [fileDetailsOpen, setFileDetailsOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<Map<string, string>>(new Map())
  const [uploadTags, setUploadTags] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [newlyUploadedIds, setNewlyUploadedIds] = useState<Set<string>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<any>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxAsset, setLightboxAsset] = useState<any>(null)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [fileToRename, setFileToRename] = useState<any>(null)

  // Load assets and stats on mount
  useEffect(() => {
    getAssets()
    getAssetStats()
  }, [getAssets, getAssetStats])

  // Prevent default browser drag and drop behavior on the entire page
  useEffect(() => {
    const handlePageDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    
    const handlePageDrop = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('dragover', handlePageDragOver)
    document.addEventListener('drop', handlePageDrop)

    return () => {
      document.removeEventListener('dragover', handlePageDragOver)
      document.removeEventListener('drop', handlePageDrop)
    }
  }, [])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [])

  // Filter media files based on search query, type, and tags
  const filteredMediaFiles = mediaFiles.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || file.file_type === selectedType
    const fileTags = file.metadata?.tags || []
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => fileTags.includes(tag))
    return matchesSearch && matchesType && matchesTags
  })

  // Get all unique tags from files
  const allTags = Array.from(new Set(
    mediaFiles.flatMap((file) => file.metadata?.tags || [])
  ))


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

  const getFileThumbnail = (file: File) => {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`
    const previewUrl = filePreviews.get(fileKey)
    
    if (previewUrl && file.type.startsWith('image/')) {
      return (
        <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
          <img 
            src={previewUrl} 
            alt={file.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to file icon if thumbnail fails to load
              const imgElement = e.target as HTMLImageElement;
              const container = imgElement.parentElement;
              if (container) {
                container.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-blue-50"><svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" /></svg></div>';
              }
            }}
          />
        </div>
      )
    }
    
    // For non-image files, show appropriate icon
    const fileType = file.type.includes('pdf') ? 'pdf' 
      : file.type.includes('document') ? 'document'
      : file.type.includes('sheet') ? 'spreadsheet'
      : file.type.startsWith('image/') ? 'image'
      : 'other'
      
    return (
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
        {getFileIcon(fileType)}
      </div>
    )
  }


  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const validateFile = (file: File): string | null => {
    // File size limit (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`
    }
    
    // File type validation
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    processSelectedFiles(files)
    
    // Reset the input
    event.target.value = ''
  }

  const generateFilePreviews = (files: File[]) => {
    const newPreviews = new Map<string, string>()
    
    files.forEach(file => {
      // Generate unique key for this file
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      
      if (file.type.startsWith('image/')) {
        // Create object URL for image files
        const previewUrl = URL.createObjectURL(file)
        newPreviews.set(fileKey, previewUrl)
      }
    })
    
    // Clean up old preview URLs to prevent memory leaks
    filePreviews.forEach(url => {
      URL.revokeObjectURL(url)
    })
    
    setFilePreviews(newPreviews)
  }

  const processSelectedFiles = (files: File[]) => {
    setUploadError(null)
    
    // Validate each file
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
    
    // Show validation errors
    if (validationErrors.length > 0) {
      setUploadError(validationErrors.join(' '))
    }
    
    // Set valid files and generate previews
    setSelectedFiles(validFiles)
    generateFilePreviews(validFiles)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (isUploading) return

    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      processSelectedFiles(files)
    }
  }

  const handleDeleteClick = (file: any) => {
    setFileToDelete(file)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return
    
    try {
      await deleteAsset(fileToDelete.id)
      toast.success("File deleted successfully")
      setDeleteDialogOpen(false)
      setFileToDelete(null)
      // Refresh assets list
      await getAssets()
      await getAssetStats()
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete file")
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }

  const handleImageClick = useCallback((asset: any) => {
    if (asset.file_type === 'image') {
      setLightboxAsset(asset)
      setLightboxOpen(true)
    }
  }, [])

  const handleShowDetails = useCallback((asset: any) => {
    setSelectedFile(asset)
    setFileDetailsOpen(true)
  }, [])

  const handleRename = async (asset: any, newName: string) => {
    try {
      await updateAsset(asset.id, { name: newName })
      toast.success('File renamed successfully')
      await getAssets()
    } catch (error) {
      console.error('Rename error:', error)
      toast.error('Failed to rename file')
    }
  }

  const handleOpenRenameModal = useCallback((asset: any) => {
    setFileToRename(asset)
    setRenameModalOpen(true)
  }, [])

  const handleDownload = async (asset: any) => {
    try {
      const signedUrl = await getSignedUrl(asset.id, 3600)
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = asset.original_filename || asset.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Download failed. Please try again.')
    }
  }

  const handleCopyLink = async (asset: any) => {
    try {
      const signedUrl = await getSignedUrl(asset.id, 3600)
      await navigator.clipboard.writeText(signedUrl)
      toast.success('Link copied to clipboard')
    } catch (error) {
      console.error('Copy link failed:', error)
      toast.error('Failed to copy link. Please try again.')
    }
  }

  const confirmUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploadError(null)
    const newUploadedIds = new Set<string>()

    try {
      const tags = uploadTags.split(",").map(tag => tag.trim()).filter(Boolean)
      
      for (const file of selectedFiles) {
        const result = await uploadAsset({
          file,
          tags,
          category: selectedType !== "all" ? selectedType : undefined,
          description: `Uploaded ${file.name}`
        })
        
        if (result) {
          newUploadedIds.add(result.id)
          toast.success(`${file.name} uploaded successfully`)
        }
      }

      setNewlyUploadedIds(newUploadedIds)
      
      // Clear the highlight after 3 seconds
      setTimeout(() => {
        setNewlyUploadedIds(new Set())
      }, 3000)

      // Refresh assets list
      await getAssets()
      await getAssetStats()

    } catch (error) {
      console.error("Upload error:", error)
      setUploadError("Failed to upload files. Please try again.")
      toast.error("Upload failed")
    } finally {
      setUploadDialogOpen(false)
      setSelectedFiles([])
      setUploadTags("")
      // Clean up preview URLs
      filePreviews.forEach(url => {
        URL.revokeObjectURL(url)
      })
      setFilePreviews(new Map())
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-4 text-lg font-medium">Tags</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {allTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedTags.length > 0 && (
                <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelectedTags([])}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 md:col-span-9">
          {filteredMediaFiles.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No files found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || selectedType !== "all" || selectedTags.length > 0
                  ? "Try adjusting your search or filters"
                  : "Upload files to your media library"}
              </p>
              <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMediaFiles.map((file) => {
                const isNewlyUploaded = newlyUploadedIds.has(file.id)
                return (
                <Card 
                  key={file.id} 
                  className={`overflow-hidden transition-all duration-1000 ${
                    isNewlyUploaded 
                      ? "ring-2 ring-green-500 shadow-lg shadow-green-500/20 animate-pulse" 
                      : ""
                  }`}
                >
                  <div
                    className="relative aspect-[3/2] bg-muted cursor-pointer"
                    onClick={() => handleImageClick(file)}
                  >
                    {file.file_type === "image" ? (
                      <img
                        src={file.file_url || "/placeholder.svg"}
                        alt={file.filename}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback to file icon if image fails to load
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
                    <div className="absolute right-2 top-2">
                      <FileActions
                        asset={file}
                        onDelete={handleDeleteClick}
                        onShowDetails={handleShowDetails}
                        onRename={handleRename}
                        onOpenRenameModal={handleOpenRenameModal}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold truncate" title={file.filename}>
                        {file.filename}
                      </h3>
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
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Size</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMediaFiles.map((file) => {
                    const isNewlyUploaded = newlyUploadedIds.has(file.id)
                    return (
                    <tr 
                      key={file.id} 
                      className={`border-b transition-all duration-1000 ${
                        isNewlyUploaded 
                          ? "bg-green-50 ring-1 ring-green-200 animate-pulse" 
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => handleImageClick(file)}
                        >
                          {getFileIcon(file.file_type)}
                          <span className="font-medium">{file.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{file.file_type}</td>
                      <td className="px-4 py-3">{formatFileSize(file.file_size)}</td>
                      <td className="px-4 py-3">{new Date(file.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <FileActions
                          asset={file}
                          onDelete={handleDeleteClick}
                          onShowDetails={handleShowDetails}
                          onRename={handleRename}
                          onOpenRenameModal={handleOpenRenameModal}
                        />
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>Upload files to your media library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Error Alert */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{uploadError}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="ml-4"
                    onClick={() => {
                      setUploadError(null)
                      confirmUpload()
                    }}
                    disabled={selectedFiles.length === 0}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Area */}
            <Label
              htmlFor="file-upload"
              className={`flex h-32 flex-col items-center justify-center rounded-md border border-dashed cursor-pointer transition-all duration-200 ${
                isUploading 
                  ? "border-muted-foreground/50 bg-muted/30 cursor-not-allowed" 
                  : isDragOver
                  ? "border-[#F6CF62] bg-[#F6CF62]/20 scale-105"
                  : "hover:border-[#F6CF62] hover:bg-[#F6CF62]/10"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground transition-colors" />
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {isUploading
                  ? "Uploading files..."
                  : isDragOver
                  ? "Drop files here to upload"
                  : selectedFiles.length > 0 
                  ? `${selectedFiles.length} file(s) selected` 
                  : "Drag and drop files here or click to browse"
                }
              </p>
              <Input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                multiple 
                onChange={handleFileSelect}
                disabled={isUploading}
                accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
              />
              <span className="mt-2 text-sm text-primary hover:underline">
                {isUploading ? "Please wait..." : "Browse Files"}
              </span>
            </Label>
            
            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                      <div key={index} className="bg-muted p-3 rounded">
                        <div className="flex items-center gap-3">
                          {getFileThumbnail(file)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-medium">{file.name}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                                {isUploading ? (
                                  <div className="flex items-center gap-1">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-xs font-medium">Uploading...</span>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-4 w-4 p-0"
                                    onClick={() => {
                                      const fileToRemove = selectedFiles[index]
                                      const fileKey = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`
                                      const previewUrl = filePreviews.get(fileKey)
                                      if (previewUrl) {
                                        URL.revokeObjectURL(previewUrl)
                                        const newPreviews = new Map(filePreviews)
                                        newPreviews.delete(fileKey)
                                        setFilePreviews(newPreviews)
                                      }
                                      setSelectedFiles(prev => prev.filter((_, i) => i !== index))
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Tags Input */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                placeholder="e.g. property, marketing, logo" 
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                disabled={isUploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Cancel"}
            </Button>
            <Button 
              onClick={() => confirmUpload()} 
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FileDetailsModal
        isOpen={fileDetailsOpen}
        onClose={() => setFileDetailsOpen(false)}
        asset={selectedFile}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
      />

      <ImagePreviewModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        asset={lightboxAsset}
      />

      <RenameFileModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        asset={fileToRename}
        onSubmit={handleRename}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {fileToDelete && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="w-12 h-12 rounded bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                {fileToDelete.file_type === "image" ? (
                  <img
                    src={fileToDelete.file_url || "/placeholder.svg"}
                    alt={fileToDelete.filename}
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
                  getFileIcon(fileToDelete.file_type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileToDelete.filename}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(fileToDelete.file_size)} • {new Date(fileToDelete.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
