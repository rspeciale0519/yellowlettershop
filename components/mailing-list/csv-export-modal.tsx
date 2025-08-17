"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { exportListToCSV } from '@/lib/supabase/mailing-lists'
import { Download, FileText, AlertCircle, Loader2 } from "lucide-react"

interface CSVExportModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listName: string
  recordCount: number
}

const FIELD_GROUPS = {
  basic: {
    label: 'Basic Information',
    fields: ['first_name', 'last_name', 'email', 'phone']
  },
  address: {
    label: 'Address',
    fields: ['address_line1', 'address_line2', 'city', 'state', 'zip_code', 'county']
  },
  property: {
    label: 'Property Details',
    fields: ['property_type', 'bedrooms', 'bathrooms', 'square_feet', 'year_built', 'estimated_value', 'last_sale_date', 'last_sale_price']
  },
  mortgage: {
    label: 'Mortgage Information',
    fields: ['loan_type', 'loan_amount', 'interest_rate', 'loan_to_value', 'origination_date', 'lender_name']
  },
  demographics: {
    label: 'Demographics',
    fields: ['age', 'gender', 'marital_status', 'income', 'net_worth', 'home_ownership', 'occupation']
  },
  foreclosure: {
    label: 'Foreclosure',
    fields: ['foreclosure_status', 'filing_date', 'auction_date']
  },
  analytics: {
    label: 'Predictive Analytics',
    fields: ['likely_to_move', 'likely_to_sell', 'likely_to_refinance', 'motivation_score']
  }
}

export function CSVExportModal({ 
  isOpen, 
  onClose, 
  listId, 
  listName,
  recordCount 
}: CSVExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'standard' | 'custom'>('standard')
  const [selectedFieldGroups, setSelectedFieldGroups] = useState<string[]>(['basic', 'address'])
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [limitRecords, setLimitRecords] = useState(false)
  const [recordLimit, setRecordLimit] = useState(1000)

  const handleFieldGroupToggle = (group: string) => {
    setSelectedFieldGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    )
  }

  const getSelectedFields = (): string[] => {
    if (exportFormat === 'standard') {
      return [
        'first_name', 'last_name', 'email', 'phone',
        'address_line1', 'address_line2', 'city', 'state', 'zip_code'
      ]
    }

    const fields: string[] = []
    selectedFieldGroups.forEach(group => {
      fields.push(...FIELD_GROUPS[group as keyof typeof FIELD_GROUPS].fields)
    })
    return fields
  }

  const formatCSVRow = (values: string[]): string => {
    return values.map(value => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const fields = getSelectedFields()
      const limit = limitRecords ? recordLimit : undefined
      
      // Get records from database
      const records = await exportListToCSV(listId, fields, limit)
      
      if (!records || records.length === 0) {
        throw new Error("No records found to export")
      }

      // Build CSV content
      const csvLines: string[] = []
      
      // Add headers if requested
      if (includeHeaders) {
        const headers = fields.map(field => 
          field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        )
        csvLines.push(formatCSVRow(headers))
      }

      // Add data rows
      records.forEach(record => {
        const row = fields.map(field => {
          const value = record[field]
          if (value === null || value === undefined) return ''
          if (typeof value === 'boolean') return value ? 'Yes' : 'No'
          if (typeof value === 'number') return value.toString()
          if (value instanceof Date) return value.toLocaleDateString()
          return String(value)
        })
        csvLines.push(formatCSVRow(row))
      })

      // Create and download file
      const csvContent = csvLines.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${listName.replace(/[^a-z0-9]/gi, '_')}_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Exported ${records.length} records to CSV.`
      })

      onClose()

    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred during export.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export {listName} to CSV</DialogTitle>
          <DialogDescription>
            Configure export settings and select which fields to include in the CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Format */}
          <div>
            <Label>Export Format</Label>
            <RadioGroup 
              value={exportFormat} 
              onValueChange={(value: 'standard' | 'custom') => setExportFormat(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <label htmlFor="standard" className="text-sm cursor-pointer">
                  Standard (Name, Email, Phone, Address)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <label htmlFor="custom" className="text-sm cursor-pointer">
                  Custom (Select field groups)
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Field Selection */}
          {exportFormat === 'custom' && (
            <div>
              <Label>Select Field Groups</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(FIELD_GROUPS).map(([key, group]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${key}`}
                      checked={selectedFieldGroups.includes(key)}
                      onCheckedChange={() => handleFieldGroupToggle(key)}
                    />
                    <label htmlFor={`group-${key}`} className="text-sm cursor-pointer">
                      {group.label}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({group.fields.length} fields)
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
              />
              <label htmlFor="include-headers" className="text-sm cursor-pointer">
                Include column headers
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="limit-records"
                checked={limitRecords}
                onCheckedChange={(checked) => setLimitRecords(checked as boolean)}
              />
              <label htmlFor="limit-records" className="text-sm cursor-pointer">
                Limit number of records
              </label>
            </div>

            {limitRecords && (
              <div className="ml-6">
                <Label htmlFor="record-limit" className="text-xs">Maximum records</Label>
                <input
                  id="record-limit"
                  type="number"
                  min="1"
                  max={recordCount}
                  value={recordLimit}
                  onChange={(e) => setRecordLimit(parseInt(e.target.value) || 1000)}
                  className="w-32 px-3 py-1 mt-1 text-sm border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Total records available: {recordCount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Export Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Export Information:</p>
              <ul className="text-xs space-y-0.5 ml-4">
                <li>• Records to export: {limitRecords ? Math.min(recordLimit, recordCount) : recordCount}</li>
                <li>• Selected fields: {getSelectedFields().length}</li>
                <li>• File format: CSV (comma-separated values)</li>
                <li>• Encoding: UTF-8</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || (exportFormat === 'custom' && selectedFieldGroups.length === 0)}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
