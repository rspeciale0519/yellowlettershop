"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"

interface ParsedData {
  headers: string[]
  sampleData: string[][]
  totalRows: number
  fileType: string
}

interface ColumnMappingModalProps {
  isOpen: boolean
  onClose: () => void
  parsedData: ParsedData | null
  listId?: string | null
  listName: string
  newListName?: string
  onImportComplete: () => void
}

const SYSTEM_FIELDS = [
  { value: 'skip', label: 'Skip this column' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zipCode', label: 'ZIP Code' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' }
]

export function ColumnMappingModal({ 
  isOpen, 
  onClose, 
  parsedData,
  listId, 
  listName,
  newListName, 
  onImportComplete 
}: ColumnMappingModalProps) {
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!parsedData) return null

  const isNewList = !listId

  const handleMappingChange = (csvColumn: string, systemField: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [csvColumn]: systemField
    }))
  }

  const validateMappings = () => {
    const mappedFields = Object.values(columnMappings).filter(field => field && field !== 'skip')
    const uniqueFields = new Set(mappedFields)
    
    if (mappedFields.length !== uniqueFields.size) {
      return "Each system field can only be mapped once"
    }
    
    const hasNameField = mappedFields.includes('firstName') || mappedFields.includes('lastName')
    if (!hasNameField) {
      return "At least one name field (First Name or Last Name) is required"
    }
    
    return null
  }

  const handleImport = async () => {
    const validationError = validateMappings()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/mailing-lists/import-spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId,
          listName: isNewList ? newListName : listName,
          isNewList,
          columnMappings,
          parsedData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import spreadsheet')
      }

      const result = await response.json()
      setSuccess(true)
      onImportComplete()
      
      // Auto-close after success
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import spreadsheet')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setColumnMappings({})
    setError(null)
    setSuccess(false)
    setIsImporting(false)
    onClose()
  }

  const getMappedFieldsCount = () => {
    return Object.values(columnMappings).filter(field => field && field !== 'skip').length
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Columns - {listName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Column Mapping</h3>
                <p className="text-sm text-muted-foreground">
                  Map your spreadsheet columns to system fields. Found {parsedData.totalRows} rows.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {getMappedFieldsCount()} of {parsedData.headers.length} columns mapped
              </div>
            </div>

            {/* Column Mapping Section */}
            <div className="grid gap-4">
              {parsedData.headers.map((header, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium">{header}</Label>
                    <p className="text-sm text-muted-foreground">
                      Sample: {parsedData.sampleData[0]?.[index] || 'No data'}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Select
                      value={columnMappings[header] || ''}
                      onValueChange={(value) => handleMappingChange(header, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select system field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            {/* Data Preview */}
            <div className="space-y-2">
              <h4 className="font-medium">Data Preview</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {parsedData.headers.map((header, index) => (
                        <TableHead key={index} className="text-xs">
                          <div>
                            <div className="font-medium">{header}</div>
                            <div className="text-muted-foreground">
                              → {columnMappings[header] ? 
                                SYSTEM_FIELDS.find(f => f.value === columnMappings[header])?.label || 'Unknown' : 
                                'Not mapped'}
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.sampleData.slice(0, 3).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="text-xs max-w-32 truncate">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.sampleData.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  Showing first 3 rows of {parsedData.totalRows} total rows
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || success || getMappedFieldsCount() === 0}
          >
            {isImporting ? 'Importing...' : `Import ${parsedData.totalRows} Records`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
