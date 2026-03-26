"use client"

import { useState, useCallback } from "react"
import { Upload, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FilePreviewList } from "./file-preview-list"
import { TagSelector } from "./tag-selector"

interface MediaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (files: File[], tags: string[], onProgress?: (progress: number) => void) => Promise<void>
  isUploading: boolean
}

export function MediaUploadDialog({ 
  open, 
  onOpenChange, 
  onUpload, 
  isUploading 
}: MediaUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadTags, setUploadTags] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []
    
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    }
    
    if (errors.length > 0) {
      setUploadError(errors.join('\n'))
    } else {
      setUploadError(null)
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [])

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      setUploadProgress(0)

      await onUpload(selectedFiles, uploadTags, setUploadProgress)

      // Reset form
      setSelectedFiles([])
      setUploadTags([])
      setUploadError(null)
      setUploadProgress(0)
      onOpenChange(false)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    }
  }

  const resetDialog = () => {
    setSelectedFiles([])
    setUploadTags([])
    setUploadError(null)
    setIsDragOver(false)
    setUploadProgress(0)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetDialog()
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Media Files</DialogTitle>
          <DialogDescription>
            Upload images, documents, PDFs, or other files to your media library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragOver 
                ? 'border-[#F6CF62] bg-[#F6CF62]/10' 
                : 'border-muted-foreground/25 hover:border-[#F6CF62] hover:bg-[#F6CF62]/10'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
            <p className="text-sm text-muted-foreground">
              Supports images, PDFs, documents, and spreadsheets up to 10MB each
            </p>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <FilePreviewList 
              files={selectedFiles}
              onRemove={removeFile}
            />
          )}

          {/* Upload Tags */}
          <TagSelector
            selectedTags={uploadTags}
            onTagsChange={setUploadTags}
            label="Tags (optional)"
            placeholder="Enter tag name..."
            showClearAll={true}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
              `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}