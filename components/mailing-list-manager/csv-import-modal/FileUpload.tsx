"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'

interface FileUploadProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  file: File | null
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  isImporting: boolean
}

export function FileUpload({ fileInputRef, file, onFileSelect, isImporting }: FileUploadProps) {
  return (
    <div>
      <Label htmlFor="csv-file">CSV File</Label>
      <div className="mt-2">
        <Input
          ref={fileInputRef}
          id="csv-file"
          type="file"
          accept=".csv,text/csv"
          onChange={onFileSelect}
          disabled={isImporting}
        />
        {file && (
        {file && (
          <div
            className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate" title={file.name}>
              {file.name}
            </span>
            <span className="shrink-0">({(file.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}      </div>
    </div>
  )
}