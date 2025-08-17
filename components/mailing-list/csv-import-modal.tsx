"use client"

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { bulkImportRecords } from '@/lib/supabase/mailing-lists-extended'
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listName: string
  onImportComplete?: (recordCount: number) => void
}

export function CSVImportModal({ 
  isOpen, 
  onClose, 
  listId, 
  listName,
  onImportComplete 
}: CSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'importing' | 'complete' | 'error'>('idle')
  const [importResults, setImportResults] = useState<{
    total: number
    imported: number
    failed: number
    duplicates: number
  } | null>(null)
  
  // Import options
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [deduplicationField, setDeduplicationField] = useState<'address' | 'name' | 'phone' | 'email'>('address')
  const [validateData, setValidateData] = useState(true)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive"
        })
        return
      }
      setFile(selectedFile)
      setImportStatus('idle')
      setImportResults(null)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    
    // Parse data rows
    const records = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
      const record: any = {}
      
      headers.forEach((header, index) => {
        // Map CSV headers to database fields
        const fieldMap: { [key: string]: string } = {
          'first_name': 'first_name',
          'firstname': 'first_name',
          'last_name': 'last_name',
          'lastname': 'last_name',
          'email': 'email',
          'phone': 'phone',
          'address': 'address_line1',
          'address1': 'address_line1',
          'address2': 'address_line2',
          'city': 'city',
          'state': 'state',
          'zip': 'zip_code',
          'zipcode': 'zip_code',
          'zip_code': 'zip_code',
          'property_type': 'property_type',
          'bedrooms': 'bedrooms',
          'bathrooms': 'bathrooms',
          'square_feet': 'square_feet',
          'sqft': 'square_feet',
          'year_built': 'year_built',
          'estimated_value': 'estimated_value',
          'value': 'estimated_value',
          'loan_amount': 'loan_amount',
          'loan_type': 'loan_type',
          'interest_rate': 'interest_rate',
          'age': 'age',
          'income': 'income',
          'marital_status': 'marital_status'
        }
        
        const mappedField = fieldMap[header] || header
        if (values[index] !== undefined && values[index] !== '') {
          // Convert numeric fields
          if (['bedrooms', 'bathrooms', 'square_feet', 'year_built', 'age'].includes(mappedField)) {
            record[mappedField] = parseInt(values[index]) || null
          } else if (['estimated_value', 'loan_amount', 'interest_rate', 'income'].includes(mappedField)) {
            record[mappedField] = parseFloat(values[index]) || null
          } else {
            record[mappedField] = values[index]
          }
        }
      })
      
      // Only add if record has some data
      if (Object.keys(record).length > 0) {
        record.mailing_list_id = listId
        records.push(record)
      }
    }
    
    return records
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    setImportStatus('parsing')
    setImportProgress(10)

    try {
      // Read file content
      const text = await file.text()
      const records = parseCSV(text)
      
      if (records.length === 0) {
        throw new Error("No valid records found in CSV file")
      }

      setImportProgress(30)
      setImportStatus('importing')

      // Import records with deduplication if enabled
      const result = await bulkImportRecords(
        listId,
        records,
        skipDuplicates ? deduplicationField : undefined
      )

      setImportProgress(100)
      setImportStatus('complete')
      
      setImportResults({
        total: records.length,
        imported: result.success,
        failed: result.failed,
        duplicates: result.duplicates
      })

      toast({
        title: "Import complete",
        description: `Successfully imported ${result.success} records.`
      })

      if (onImportComplete) {
        onImportComplete(result.success)
      }

      // Close modal after delay if successful
      if (result.failed === 0) {
        setTimeout(() => {
          onClose()
        }, 2000)
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportStatus('error')
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportStatus('idle')
    setImportResults(null)
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import CSV to {listName}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import records to your mailing list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="mt-2">
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skip-duplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                disabled={isImporting}
              />
              <label htmlFor="skip-duplicates" className="text-sm">
                Skip duplicate records
              </label>
            </div>

            {skipDuplicates && (
              <div className="ml-6">
                <Label htmlFor="dedup-field" className="text-xs">Deduplicate by</Label>
                <Select
                  value={deduplicationField}
                  onValueChange={(value: any) => setDeduplicationField(value)}
                  disabled={isImporting}
                >
                  <SelectTrigger id="dedup-field" className="w-[200px] h-8 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="address">Address</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="validate-data"
                checked={validateData}
                onCheckedChange={(checked) => setValidateData(checked as boolean)}
                disabled={isImporting}
              />
              <label htmlFor="validate-data" className="text-sm">
                Validate data during import
              </label>
            </div>
          </div>

          {/* Import Progress */}
          {importStatus !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {importStatus === 'parsing' && 'Parsing CSV file...'}
                  {importStatus === 'importing' && 'Importing records...'}
                  {importStatus === 'complete' && 'Import complete!'}
                  {importStatus === 'error' && 'Import failed'}
                </span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <Alert className={importStatus === 'error' ? 'border-destructive' : ''}>
              {importStatus === 'complete' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p>Total records: {importResults.total}</p>
                  <p>Successfully imported: {importResults.imported}</p>
                  {importResults.duplicates > 0 && (
                    <p>Skipped (duplicates): {importResults.duplicates}</p>
                  )}
                  {importResults.failed > 0 && (
                    <p className="text-destructive">Failed: {importResults.failed}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* CSV Format Help */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="text-xs space-y-0.5 ml-4">
                <li>• First row must contain column headers</li>
                <li>• Supported fields: first_name, last_name, email, phone, address, city, state, zip_code</li>
                <li>• Additional property fields: bedrooms, bathrooms, square_feet, year_built, estimated_value</li>
                <li>• Use comma (,) as delimiter</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          {importStatus === 'complete' || importStatus === 'error' ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Import Another
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isImporting}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
