"use client"

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  AlertCircle,
  Loader2,
  X,
  FileImage,
  FileText,
  File,
  FileIcon as FilePdf,
} from "lucide-react"

interface UploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[], tags: string[]) => Promise<void>
  isUploading: boolean
}

export function UploadDialog({ isOpen, onClose, onUpload, isUploading }: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadTags, setUploadTags] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [filePreviews, setFilePreviews] = useState<Map<string, string>>(new Map())

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-6 w-6 text-blue-500" />
    if (type.includes('pdf')) return <FilePdf className="h-6 w-6 text-red-500" />
    if (type.includes('document') || type.includes('word')) return <FileText className="h-6 w-6 text-green-500" />
    if (type.includes('sheet') || type.includes('excel')) return <FileText className="h-6 w-6 text-green-500" />
    return <File className="h-6 w-6 text-gray-500" />
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
              const imgElement = e.target as HTMLImageElement
              const container = imgElement.parentElement
              if (container) {
                container.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-blue-50"><svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" /></svg></div>'
              }
            }}
          />
        </div>
      )
    }
    
    return (
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
        {getFileIcon(file.type)}
      </div>
    )
  }

  const generateFilePreviews = useCallback((files: File[]) => {
    const newPreviews = new Map<string, string>()
    
    files.forEach(file => {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file)
        newPreviews.set(fileKey, previewUrl)
      }
    })
    
    // Clean up old preview URLs
    filePreviews.forEach(url => {
      URL.revokeObjectURL(url)
    })
    
    setFilePreviews(newPreviews)
  }, [filePreviews])

  const processSelectedFiles = useCallback((files: File[]) => {
    setUploadError(null)
    
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
      setUploadError(validationErrors.join(' '))
    }
    
    setSelectedFiles(validFiles)
    generateFilePreviews(validFiles)
  }, [generateFilePreviews])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    processSelectedFiles(files)
    event.target.value = '' // Reset input
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    const tags = uploadTags.split(",").map(tag => tag.trim()).filter(Boolean)
    
    try {
      await onUpload(selectedFiles, tags)
      
      // Clean up
      setSelectedFiles([])
      setUploadTags("")
      setUploadError(null)
      filePreviews.forEach(url => URL.revokeObjectURL(url))
      setFilePreviews(new Map())
      onClose()
    } catch (error) {
      setUploadError("Failed to upload files. Please try again.")
    }
  }

  const removeFile = (index: number) => {
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
  }

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>Upload files to your media library</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Error Alert */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Upload Area */}
          <Label
            htmlFor="file-upload"
            className={`flex h-32 flex-col items-center justify-center rounded-md border border-dashed cursor-pointer transition-all duration-200 ${
              isUploading 
                ? "border-muted-foreground/50 bg-muted/30 cursor-not-allowed" 
                : isDragOver
                ? "border-[#F6CF62] bg-[#F6CF62]/10 scale-105"
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
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-muted p-3 rounded">
                    <div className="flex items-center gap-3">
                      {getFileThumbnail(file)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium">{file.name}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            {!isUploading && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-4 w-4 p-0"
                                onClick={() => removeFile(index)}
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
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
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
  )
}