"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, AlertTriangle, FileText, Eye, Zap, RotateCcw, Undo, Redo, Save, Download, BarChart3 } from 'lucide-react'
import { EnhancedColumnMappingSelector } from './EnhancedColumnMappingSelector'
import { DataPreview } from './DataPreview'
import { MappingValidation } from './MappingValidation'
import { getMailingListRecords } from '@/lib/supabase/mailing-lists'
import {
  ColumnMappingData,
  ColumnMappingProps,
  YLS_FIELDS,
  REQUIRED_FIELDS,
  MappingValidation as ValidationResult
} from './types'

export function ColumnMappingPage({
  sourceFile,
  sourceData,
  onMappingComplete,
  onCancel,
  mode,
  listId,
  listName
}: ColumnMappingProps) {
  const [mappingData, setMappingData] = useState<ColumnMappingData>({
    sourceColumns: [],
    mappedFields: {},
    previewData: [],
    requiredFields: REQUIRED_FIELDS,
    optionalFields: YLS_FIELDS.filter(f => !f.required).map(f => f.key)
  })
  
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    requiredFieldsMapped: false
  })
  
  const [showPreview, setShowPreview] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [useStreamlined, setUseStreamlined] = useState(true)
  const [useDragDrop, setUseDragDrop] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Parse data on component mount
  useEffect(() => {
    if (sourceFile) {
      parseFileData()
    } else if (sourceData) {
      processSourceData(sourceData)
    } else if (listId) {
      loadMailingListData()
    }
  }, [sourceFile, sourceData, listId])

  // Auto-continue when validation becomes valid (for order workflow)
  useEffect(() => {
    if (validation.isValid && mode === 'order-workflow') {
      const timer = setTimeout(() => {
        handleContinue()
      }, 1000) // 1 second delay to allow user to see completion
      return () => clearTimeout(timer)
    }
  }, [validation.isValid, mode])

  const loadMailingListData = async () => {
    if (!listId) return

    setIsLoading(true)
    try {
      const { data: records } = await getMailingListRecords(listId, { limit: 10 })
      if (records && records.length > 0) {
        processSourceData(records)
      } else {
        console.warn('No records found in mailing list')
        // Create empty mapping data
        const newMappingData: ColumnMappingData = {
          sourceColumns: [],
          mappedFields: {},
          previewData: [],
          requiredFields: REQUIRED_FIELDS,
          optionalFields: YLS_FIELDS.filter(f => !f.required).map(f => f.key)
        }
        setMappingData(newMappingData)
        validateMapping(newMappingData)
      }
    } catch (error) {
      console.error('Error loading mailing list data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const parseFileData = async () => {
    if (!sourceFile) return
    
    setIsLoading(true)
    try {
      const text = await sourceFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error('File is empty')
      }

      // Parse headers
      const headers = lines[0]
        .split(',')
        .map(h => h.trim().replace(/['"]/g, ''))
      
      // Parse sample data (first 10 rows)
      const sampleData = []
      for (let i = 1; i < Math.min(11, lines.length); i++) {
        const values = lines[i]
          .split(',')
          .map(v => v.trim().replace(/^["']|["']$/g, ''))
        
        const record: any = {}
        headers.forEach((header, index) => {
          record[header] = values[index] || ''
        })
        sampleData.push(record)
      }

      processSourceData(sampleData, headers)
    } catch (error) {
      console.error('Error parsing file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processSourceData = (data: any[], headers?: string[]) => {
    const sourceColumns = headers || Object.keys(data[0] || {})
    const autoMappedFields = generateAutoMapping(sourceColumns)
    
    const newMappingData: ColumnMappingData = {
      sourceColumns,
      mappedFields: autoMappedFields,
      previewData: data.slice(0, 10),
      requiredFields: REQUIRED_FIELDS,
      optionalFields: YLS_FIELDS.filter(f => !f.required).map(f => f.key)
    }
    
    setMappingData(newMappingData)
    validateMapping(newMappingData)
  }

  const generateAutoMapping = (sourceColumns: string[]): Record<string, string | null> => {
    const mapping: Record<string, string | null> = {}
    
    // Initialize all YLS fields as unmapped
    YLS_FIELDS.forEach(field => {
      mapping[field.key] = null
    })

    // Auto-map based on common patterns
    const mappingPatterns: Record<string, string[]> = {
      first_name: ['first_name', 'firstname', 'first', 'fname'],
      last_name: ['last_name', 'lastname', 'last', 'lname'],
      email: ['email', 'email_address', 'e_mail'],
      phone: ['phone', 'phone_number', 'telephone', 'mobile'],
      address_line_1: ['address', 'address1', 'address_line_1', 'street', 'street_address'],
      address_line_2: ['address2', 'address_line_2', 'unit', 'apt', 'suite'],
      city: ['city'],
      state: ['state', 'st'],
      zip_code: ['zip', 'zip_code', 'zipcode', 'postal_code'],
      company: ['company', 'company_name', 'business'],
      property_type: ['property_type', 'prop_type'],
      bedrooms: ['bedrooms', 'beds', 'bedroom_count'],
      bathrooms: ['bathrooms', 'baths', 'bathroom_count'],
      square_feet: ['square_feet', 'sqft', 'sq_ft', 'size'],
      year_built: ['year_built', 'built_year', 'construction_year'],
      estimated_value: ['estimated_value', 'value', 'property_value', 'home_value'],
      loan_amount: ['loan_amount', 'mortgage_amount', 'loan'],
      age: ['age'],
      income: ['income', 'household_income']
    }

    sourceColumns.forEach(sourceCol => {
      const normalizedSource = sourceCol.toLowerCase().trim()
      
      for (const [ylsField, patterns] of Object.entries(mappingPatterns)) {
        if (patterns.some(pattern => 
          normalizedSource === pattern || 
          normalizedSource.includes(pattern) ||
          pattern.includes(normalizedSource)
        )) {
          mapping[ylsField] = sourceCol
          break
        }
      }
    })

    return mapping
  }

  const validateMapping = (data: ColumnMappingData) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check required fields
    const unmappedRequired = REQUIRED_FIELDS.filter(field => !data.mappedFields[field])
    if (unmappedRequired.length > 0) {
      errors.push(`Required fields not mapped: ${unmappedRequired.join(', ')}`)
    }

    // Check for duplicate mappings
    const mappedColumns = Object.values(data.mappedFields).filter(Boolean)
    const duplicates = mappedColumns.filter((col, index) => 
      mappedColumns.indexOf(col) !== index
    )
    if (duplicates.length > 0) {
      errors.push(`Duplicate mappings detected: ${duplicates.join(', ')}`)
    }

    // Warnings for recommended fields
    const recommendedFields = ['email', 'phone']
    const unmappedRecommended = recommendedFields.filter(field => !data.mappedFields[field])
    if (unmappedRecommended.length > 0) {
      warnings.push(`Consider mapping these useful fields: ${unmappedRecommended.join(', ')}`)
    }

    const validation: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredFieldsMapped: unmappedRequired.length === 0
    }

    setValidation(validation)
  }

  const handleMappingChange = (ylsField: string, sourceColumn: string | null) => {
    const newMappingData = {
      ...mappingData,
      mappedFields: {
        ...mappingData.mappedFields,
        [ylsField]: sourceColumn
      }
    }
    setMappingData(newMappingData)
    validateMapping(newMappingData)
  }

  const handleBulkMappingChange = (newMappedFields: Record<string, string | null>) => {
    const newMappingData = {
      ...mappingData,
      mappedFields: newMappedFields
    }
    setMappingData(newMappingData)
    validateMapping(newMappingData)
  }

  // Action toolbar functions
  const autoMap = useCallback(() => {
    const mappingPatterns: Record<string, string[]> = {
      first_name: ['first_name', 'firstname', 'first', 'fname'],
      last_name: ['last_name', 'lastname', 'last', 'lname'],
      email: ['email', 'email_address', 'e_mail'],
      phone: ['phone', 'phone_number', 'telephone', 'mobile'],
      address_line_1: ['address', 'address1', 'address_line_1', 'street'],
      address_line_2: ['address2', 'address_line_2', 'unit', 'apt'],
      city: ['city'],
      state: ['state', 'st'],
      zip_code: ['zip', 'zip_code', 'zipcode', 'postal_code'],
      company: ['company', 'company_name', 'business'],
    }

    const newMappedFields = { ...mappingData.mappedFields }
    mappingData.sourceColumns.forEach(sourceCol => {
      const normalizedSource = sourceCol.toLowerCase().trim()
      for (const [ylsField, patterns] of Object.entries(mappingPatterns)) {
        if (newMappedFields[ylsField]) continue // Skip if already mapped
        const isMatch = patterns.some(pattern =>
          normalizedSource === pattern ||
          normalizedSource.includes(pattern)
        )
        if (isMatch) {
          newMappedFields[ylsField] = sourceCol
          break
        }
      }
    })

    handleBulkMappingChange(newMappedFields)
  }, [mappingData, handleBulkMappingChange])

  const clearAllMappings = useCallback(() => {
    const clearedMappings: Record<string, string | null> = {}
    YLS_FIELDS.forEach(field => {
      clearedMappings[field.key] = null
    })
    handleBulkMappingChange(clearedMappings)
  }, [handleBulkMappingChange])

  const handleUndo = useCallback(() => {
    // Placeholder for undo functionality
    console.log('Undo clicked')
  }, [])

  const handleRedo = useCallback(() => {
    // Placeholder for redo functionality
    console.log('Redo clicked')
  }, [])

  const handleSaveTemplate = useCallback(() => {
    const templateName = prompt('Enter a name for this mapping template:')
    if (!templateName) return
    console.log('Save template:', templateName, mappingData.mappedFields)
  }, [mappingData.mappedFields])

  const handleExport = useCallback(() => {
    const exportData = {
      mappings: mappingData.mappedFields,
      sourceColumns: mappingData.sourceColumns,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `column-mappings-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [mappingData])

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  const handleContinue = () => {
    if (validation.isValid) {
      onMappingComplete(mappingData)
    }
  }

  const getPageTitle = () => {
    switch (mode) {
      case 'order-workflow':
        return 'Map Your Mailing List Columns'
      case 'mlm-import':
        return `Import to ${listName}`
      default:
        return 'Column Mapping'
    }
  }

  const getPageDescription = () => {
    switch (mode) {
      case 'order-workflow':
        return 'Map your list columns to YLS fields so we can personalize your mail pieces correctly.'
      case 'mlm-import':
        return 'Map your CSV columns to the appropriate fields in your mailing list.'
      default:
        return 'Map your data columns to the appropriate fields.'
    }
  }

  const getDataSourceName = () => {
    if (sourceFile) {
      return sourceFile.name
    } else if (listName) {
      return listName
    } else if (sourceData && sourceData.length > 0) {
      return `${sourceData.length} manual records`
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing your file...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Top Section - Column Mapping */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Column Mapping</span>
                    {getDataSourceName() && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm font-normal text-gray-600">{getDataSourceName()}</span>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Map your file columns to YLS fields. Required fields must be mapped to continue.
                  </CardDescription>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center flex-wrap gap-2">
                  {/* Interface Toggles */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="streamlined-toggle" className="text-sm">
                      Streamlined
                    </Label>
                    <Switch
                      id="streamlined-toggle"
                      checked={useStreamlined}
                      onCheckedChange={setUseStreamlined}
                    />
                  </div>
                  {!useStreamlined && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="dragdrop-toggle" className="text-sm">
                        Drag & Drop
                      </Label>
                      <Switch
                        id="dragdrop-toggle"
                        checked={useDragDrop}
                        onCheckedChange={setUseDragDrop}
                      />
                    </div>
                  )}
                  <div className="w-px h-4 bg-gray-300 mx-2" />

                  {/* Action Buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={autoMap}
                    className="flex items-center space-x-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Auto-Map</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllMappings}
                    className="flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </Button>

                  {canUndo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndo}
                      className="flex items-center space-x-1"
                    >
                      <Undo className="w-3 h-3" />
                      <span>Undo</span>
                    </Button>
                  )}

                  {canRedo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRedo}
                      className="flex items-center space-x-1"
                    >
                      <Redo className="w-3 h-3" />
                      <span>Redo</span>
                    </Button>
                  )}

                  {mode === 'order-workflow' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveTemplate}
                      className="flex items-center space-x-1"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Template</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center space-x-1"
                  >
                    <BarChart3 className="w-3 h-3" />
                    <span>{showStats ? 'Hide' : 'Show'} Stats</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedColumnMappingSelector
                mappingData={mappingData}
                onMappingChange={handleMappingChange}
                onBulkMappingChange={handleBulkMappingChange}
                validation={validation}
                showTemplates={mode === 'order-workflow'}
                useStreamlined={useStreamlined}
                useDragDrop={useDragDrop}
                showStats={showStats}
              />
            </CardContent>
          </Card>

          <MappingValidation validation={validation} />

          {/* Bottom Section - Data Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Preview how your data will appear after mapping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataPreview
                  mappingData={mappingData}
                  validation={validation}
                />
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  )
}