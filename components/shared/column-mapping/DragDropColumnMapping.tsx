"use client"

import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  GripVertical,
  X,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Undo,
  Redo,
  RotateCcw,
  Save,
  FileText,
  Database,
  BarChart
} from 'lucide-react'
import {
  ColumnMappingData,
  YLS_FIELDS,
  REQUIRED_FIELDS,
  MappingValidation as ValidationResult,
  MappingHistory,
  ColumnStatistics
} from './types'

interface DragDropColumnMappingProps {
  mappingData: ColumnMappingData
  onMappingChange: (ylsField: string, sourceColumn: string | null) => void
  onClearAllMappings?: () => void
  validation: ValidationResult
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onSaveTemplate?: () => void
  columnStats?: ColumnStatistics[]
}

export function DragDropColumnMapping({
  mappingData,
  onMappingChange,
  onClearAllMappings,
  validation,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSaveTemplate,
  columnStats = []
}: DragDropColumnMappingProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [hoveredField, setHoveredField] = useState<string | null>(null)

  const { sourceColumns, mappedFields } = mappingData

  const requiredFields = YLS_FIELDS.filter(field => field.required)
  const optionalFields = YLS_FIELDS.filter(field => !field.required)

  // Get unmapped source columns
  const getUnmappedColumns = () => {
    const mappedColumns = Object.values(mappedFields).filter(Boolean) as string[]
    return sourceColumns.filter(col => !mappedColumns.includes(col))
  }

  // Get completion percentage
  const getCompletionPercentage = () => {
    const totalRequired = requiredFields.length
    const mappedRequired = requiredFields.filter(field => mappedFields[field.key]).length
    return Math.round((mappedRequired / totalRequired) * 100)
  }

  // Get column statistics for a specific column
  const getColumnStats = (columnName: string) => {
    return columnStats.find(stat => stat.columnName === columnName)
  }

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    setDraggedColumn(null)
    setHoveredField(null)

    if (!result.destination) return

    const sourceColumn = result.draggableId
    const targetField = result.destination.droppableId

    // If dropping on the same field that already has this mapping, do nothing
    if (mappedFields[targetField] === sourceColumn) return

    // If target field already has a mapping, we need to handle the swap/replacement
    const existingMapping = mappedFields[targetField]

    // Update the mapping
    onMappingChange(targetField, sourceColumn)

    // If there was an existing mapping, we could either:
    // 1. Clear it (current behavior)
    // 2. Swap the mappings
    // For now, we'll clear the existing mapping
  }

  const handleDragStart = (result: any) => {
    setDraggedColumn(result.draggableId)
  }

  const clearMapping = (fieldKey: string) => {
    onMappingChange(fieldKey, null)
  }

  const clearAllMappings = () => {
    YLS_FIELDS.forEach(field => {
      onMappingChange(field.key, null)
    })
  }

  // Auto-map function with improved logic
  const autoMap = () => {
    const mappingPatterns: Record<string, string[]> = {
      first_name: ['first_name', 'firstname', 'first', 'fname', 'givenname'],
      last_name: ['last_name', 'lastname', 'last', 'lname', 'surname', 'familyname'],
      email: ['email', 'email_address', 'e_mail', 'emailaddress'],
      phone: ['phone', 'phone_number', 'telephone', 'mobile', 'cell'],
      address_line_1: ['address', 'address1', 'address_line_1', 'street', 'street_address', 'streetaddress'],
      address_line_2: ['address2', 'address_line_2', 'unit', 'apt', 'suite', 'apartment'],
      city: ['city', 'town', 'municipality'],
      state: ['state', 'st', 'province', 'region'],
      zip_code: ['zip', 'zip_code', 'zipcode', 'postal_code', 'postalcode', 'postcode'],
      company: ['company', 'company_name', 'business', 'organization', 'org'],
    }

    const newMappings: Record<string, string | null> = { ...mappedFields }

    sourceColumns.forEach(sourceCol => {
      const normalizedSource = sourceCol.toLowerCase().trim().replace(/[^a-z0-9]/g, '')

      for (const [ylsField, patterns] of Object.entries(mappingPatterns)) {
        // Skip if field is already mapped
        if (newMappings[ylsField]) continue

        const isMatch = patterns.some(pattern => {
          const normalizedPattern = pattern.replace(/[^a-z0-9]/g, '')
          return normalizedSource === normalizedPattern ||
                 normalizedSource.includes(normalizedPattern) ||
                 normalizedPattern.includes(normalizedSource)
        })

        if (isMatch) {
          newMappings[ylsField] = sourceCol
          break
        }
      }
    })

    // Apply all mappings
    Object.entries(newMappings).forEach(([field, column]) => {
      if (mappedFields[field] !== column) {
        onMappingChange(field, column)
      }
    })
  }

  // Render source column card
  const renderSourceColumn = (column: string, index: number) => {
    const stats = getColumnStats(column)
    const isMapped = Object.values(mappedFields).includes(column)

    return (
      <Draggable key={column} draggableId={column} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              group relative bg-white border rounded-lg p-3 shadow-sm transition-all duration-200
              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-[#F6CF62] rotate-3' : 'hover:shadow-md'}
              ${isMapped ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#F6CF62]'}
              cursor-grab active:cursor-grabbing
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-[#F6CF62]" />
                  <span className="font-medium text-sm truncate">{column}</span>
                  {isMapped && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                </div>

                {stats && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Completeness</span>
                      <span>{stats.completeness}%</span>
                    </div>
                    <Progress value={stats.completeness} className="h-1" />

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{stats.filledRows}/{stats.totalRows} filled</span>
                      <Badge variant="outline" className="text-xs px-1">
                        {stats.dataType}
                      </Badge>
                    </div>

                    {stats.sampleValues.length > 0 && (
                      <div className="text-xs text-gray-500 truncate">
                        e.g., {stats.sampleValues.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>
    )
  }

  // Render YLS field drop zone
  const renderYLSField = (field: typeof YLS_FIELDS[0]) => {
    const mappedColumn = mappedFields[field.key]
    const isRequired = field.required
    const isMapped = mappedColumn !== null
    const isHovered = hoveredField === field.key
    const isDraggedColumnCompatible = draggedColumn !== null

    return (
      <Droppable key={field.key} droppableId={field.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            onMouseEnter={() => setHoveredField(field.key)}
            onMouseLeave={() => setHoveredField(null)}
            className={`
              relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 min-h-[100px]
              ${snapshot.isDraggedOver ? 'border-[#F6CF62] bg-[#FFF9E8] scale-105' : ''}
              ${isHovered && draggedColumn ? 'border-[#F6CF62] bg-[#FFF9E8]' : ''}
              ${isMapped ? 'border-green-300 bg-green-50' :
                isRequired ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}
              ${isDraggedColumnCompatible ? 'cursor-pointer' : ''}
            `}
          >
            {/* Field header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{field.label}</span>
                  {isRequired ? (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      Optional
                    </Badge>
                  )}
                </div>

                {field.description && (
                  <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                )}

                {field.example && (
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Example:</span> {field.example}
                  </p>
                )}
              </div>

              {isMapped && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearMapping(field.key)}
                  className="h-6 w-6 p-0 hover:bg-red-100"
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              )}
            </div>

            {/* Mapped column display */}
            {isMapped ? (
              <div className="bg-white border border-green-300 rounded p-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">{mappedColumn}</span>
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <FileText className={`h-6 w-6 mx-auto mb-1 ${isRequired ? 'text-red-400' : 'text-gray-400'}`} />
                <p className="text-xs text-gray-500">
                  {snapshot.isDraggedOver ? 'Drop here' : 'Drag a column here'}
                </p>
              </div>
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress and Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Column Mapping Progress</CardTitle>
              <CardDescription>
                {getCompletionPercentage()}% complete • {requiredFields.filter(f => mappedFields[f.key]).length}/{requiredFields.length} required fields mapped
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2">
              {canUndo && (
                <Button variant="outline" size="sm" onClick={onUndo}>
                  <Undo className="h-4 w-4" />
                </Button>
              )}
              {canRedo && (
                <Button variant="outline" size="sm" onClick={onRedo}>
                  <Redo className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClearAllMappings || clearAllMappings}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button variant="outline" size="sm" onClick={autoMap}>
                Auto-Map
              </Button>
              {onSaveTemplate && (
                <Button variant="outline" size="sm" onClick={onSaveTemplate}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Template
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getCompletionPercentage()} className="h-2" />
        </CardContent>
      </Card>

      {/* Validation Alert */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <div key={index}>{warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Columns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="h-5 w-5" />
                <span>Your Data Columns</span>
                <Badge variant="outline">{sourceColumns.length}</Badge>
              </CardTitle>
              <CardDescription>
                Drag columns to map them to YLS fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="source-columns" isDropDisabled={true}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3 max-h-96 overflow-y-auto"
                  >
                    {getUnmappedColumns().map((column, index) =>
                      renderSourceColumn(column, index)
                    )}
                    {provided.placeholder}

                    {getUnmappedColumns().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p>All columns have been mapped!</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          {/* YLS Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>YLS Fields</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs"
                >
                  {showOptionalFields ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showOptionalFields ? 'Hide' : 'Show'} Optional
                </Button>
              </CardTitle>
              <CardDescription>
                Drop columns here to create mappings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Required Fields */}
                <div>
                  <h4 className="font-medium text-sm mb-3 text-red-700">Required Fields</h4>
                  <div className="space-y-3">
                    {requiredFields.map(renderYLSField)}
                  </div>
                </div>

                {/* Optional Fields */}
                {showOptionalFields && (
                  <div>
                    <h4 className="font-medium text-sm mb-3 text-gray-700">Optional Fields</h4>
                    <div className="space-y-3">
                      {optionalFields.map(renderYLSField)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {requiredFields.filter(f => mappedFields[f.key]).length}
              </div>
              <div className="text-sm text-gray-600">Required Fields Mapped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {optionalFields.filter(f => mappedFields[f.key]).length}
              </div>
              <div className="text-sm text-gray-600">Optional Fields Mapped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {getUnmappedColumns().length}
              </div>
              <div className="text-sm text-gray-600">Unmapped Columns</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}