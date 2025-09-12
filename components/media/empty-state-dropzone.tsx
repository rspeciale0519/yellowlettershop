"use client"

import React, { useState, useRef } from 'react'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface EmptyStateDropzoneProps {
  onFilesSelected: (files: File[]) => void
  isUploading?: boolean
}

export function EmptyStateDropzone({ onFilesSelected, isUploading = false }: EmptyStateDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      onFilesSelected(files)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
    event.target.value = '' // Reset input
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="text-center py-20">
      <div
        className={`mx-auto w-full p-12 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isUploading 
            ? "border-muted-foreground/50 bg-muted/30 cursor-not-allowed" 
            : isDragOver
            ? "border-[#F6CF62] bg-[#F6CF62]/10 scale-105"
            : "border-muted-foreground/25 hover:border-[#F6CF62] hover:bg-[#F6CF62]/10 hover:scale-105"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Plus className={`h-20 w-20 transition-colors ${
              isDragOver ? "text-[#F6CF62]" : "text-muted-foreground"
            }`} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isUploading 
                ? "Uploading files..." 
                : isDragOver 
                ? "Drop files here to upload"
                : "No files found"
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isUploading
                ? "Please wait while your files are being uploaded..."
                : isDragOver
                ? "Release to upload your files"
                : "Drag and drop files here to upload, or click to browse. You can also try adjusting your filters above."
              }
            </p>
          </div>

          {!isUploading && (
            <Button 
              variant="outline" 
              className={`transition-colors ${
                isDragOver ? "border-[#F6CF62] text-[#F6CF62]" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          )}

          <Input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            multiple 
            onChange={handleFileSelect}
            disabled={isUploading}
            accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
          />
        </div>
      </div>
    </div>
  )
}