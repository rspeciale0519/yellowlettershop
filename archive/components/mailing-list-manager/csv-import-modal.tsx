"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ColumnMappingModal } from "./column-mapping-modal"

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  listId?: string | null
  listName?: string | null
  onImportComplete: () => void
}

interface ParsedData {
  headers: string[]
  sampleData: string[][]
  totalRows: number
  fileType: string
}

export function CSVImportModal({ 
  isOpen, 
  onClose, 
  listId, 
  listName, 
  onImportComplete 
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [newListName, setNewListName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine if we're creating a new list or adding to existing
  const isNewList = !listId
  const effectiveListName = isNewList ? newListName : (listName || '')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase()
      const isValidFile = fileName.endsWith('.csv') || 
                         fileName.endsWith('.xlsx') || 
                         fileName.endsWith('.xls') || 
                         fileName.endsWith('.ods')
      
      if (!isValidFile) {
        setError('Please select a valid spreadsheet file (CSV, Excel, or ODS)')
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
      setParsedData(null)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase()
      const isValidFile = fileName.endsWith('.csv') || 
                         fileName.endsWith('.xlsx') || 
                         fileName.endsWith('.xls') || 
                         fileName.endsWith('.ods')
      
      if (!isValidFile) {
        setError('Please select a valid spreadsheet file (CSV, Excel, or ODS)')
        return
      }
      setFile(droppedFile)
      setError(null)
      setSuccess(false)
      setParsedData(null)
    }
  }

  const handleImport = async () => {
    if (!file) return
    
    // Validate list name is provided for new lists
    if (isNewList && !newListName.trim()) {
      setError('Please provide a name for the new mailing list')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/mailing-lists/parse-spreadsheet', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse spreadsheet')
      }

      const result = await response.json()
      setParsedData(result.data)
      setShowColumnMapping(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse spreadsheet')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setNewListName('')
    setError(null)
    setSuccess(false)
    setIsUploading(false)
    setParsedData(null)
    setShowColumnMapping(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleColumnMappingClose = () => {
    setShowColumnMapping(false)
    setParsedData(null)
  }

  const handleImportComplete = () => {
    setSuccess(true)
    onImportComplete()
    setShowColumnMapping(false)
    
    // Auto-close after success
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNewList ? 'Import Spreadsheet - Create New List' : `Import Spreadsheet to ${effectiveListName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Spreadsheet imported successfully!</AlertDescription>
            </Alert>
          )}

          {isNewList && (
            <div className="space-y-2">
              <Label htmlFor="list-name">Mailing List Name *</Label>
              <Input
                id="list-name"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter a name for your new mailing list"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                This will be used as the "List Name" tag for all imported records
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="csv-file">Select Spreadsheet File</Label>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your spreadsheet file here, or click to browse
                  </p>
                </div>
              )}
            </div>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv,.xlsx,.xls,.ods"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              Browse Files
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>File Format Requirements:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Supported formats: CSV, Excel (.xlsx, .xls), OpenDocument (.ods)</li>
              <li>First row should contain column headers</li>
              <li>Supported columns: firstName, lastName, address, city, state, zipCode, email, phone</li>
              <li>File size limit: 10MB</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isUploading || success || (isNewList && !newListName.trim())}
          >
            {isUploading ? 'Parsing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={showColumnMapping}
        onClose={handleColumnMappingClose}
        parsedData={parsedData}
        listId={listId}
        listName={effectiveListName}
        newListName={isNewList ? newListName : undefined}
        onImportComplete={handleImportComplete}
      />
    </Dialog>
  )
}
