"use client"

import React, { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Database,
  BarChart3,
  X
} from 'lucide-react'
import {
  ColumnMappingData,
  YLS_FIELDS,
  REQUIRED_FIELDS,
  MappingValidation as ValidationResult,
  ColumnStatistics
} from './types'

interface StreamlinedColumnMappingProps {
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
  showStats?: boolean
}

export function StreamlinedColumnMapping({
  mappingData,
  onMappingChange,
  onClearAllMappings,
  validation,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSaveTemplate,
  columnStats = [],
  showStats = false
}: StreamlinedColumnMappingProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)

  const { sourceColumns, mappedFields } = mappingData
  const requiredFields = YLS_FIELDS.filter(field => field.required)
  const optionalFields = YLS_FIELDS.filter(field => !field.required)

  // Get unmapped source columns
  const getUnmappedColumns = () => {
    const mappedColumns = Object.values(mappedFields).filter(Boolean) as string[]
    return sourceColumns.filter(col => !mappedColumns.includes(col))
  }

  // Get completion status
  const getCompletionStatus = () => {
    const totalRequired = requiredFields.length
    const mappedRequired = requiredFields.filter(field => mappedFields[field.key]).length
    const totalOptional = optionalFields.length
    const mappedOptional = optionalFields.filter(field => mappedFields[field.key]).length

    return {
      requiredComplete: mappedRequired === totalRequired,
      requiredCount: mappedRequired,
      requiredTotal: totalRequired,
      optionalCount: mappedOptional,
      optionalTotal: totalOptional,
      unmappedCount: getUnmappedColumns().length
    }
  }

  const status = getCompletionStatus()

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    setDraggedColumn(null)
    if (!result.destination) return

    const sourceColumn = result.draggableId
    const targetField = result.destination.droppableId
    onMappingChange(targetField, sourceColumn)
  }

  const handleDragStart = (result: any) => {
    setDraggedColumn(result.draggableId)
  }

  const clearMapping = (fieldKey: string) => {
    onMappingChange(fieldKey, null)
  }



  // Render field mapping row (simplified)
  const renderFieldRow = (field: typeof YLS_FIELDS[0]) => {
    const mappedColumn = mappedFields[field.key]
    const isMapped = mappedColumn !== null
    const isRequired = field.required

    return (
      <Droppable key={field.key} droppableId={field.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex items-center justify-between py-2 px-3 rounded-lg border transition-all
              ${snapshot.isDraggedOver ? 'border-[#F6CF62] bg-[#FFF9E8]' : 'border-gray-200'}
              ${isMapped ? 'bg-green-50 border-green-200' : isRequired ? 'bg-red-50 border-red-200' : ''}
            `}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0">
                {isMapped ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : isRequired ? (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                ) : (
                  <div className="w-3 h-3 border border-gray-300 rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{field.label}</span>
                  {isRequired && (
                    <Badge variant="outline" className="text-xs px-1 py-0 text-red-600 border-red-200">
                      Required
                    </Badge>
                  )}
                </div>
                {showStats && field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isMapped ? (
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{mappedColumn}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearMapping(field.key)}
                    className="w-6 h-6 p-0 hover:bg-red-100"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 px-3 py-1 bg-gray-100 rounded">
                  {snapshot.isDraggedOver ? 'Drop here' : 'Drag column here'}
                </span>
              )}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    )
  }

  // Render draggable column
  const renderDraggableColumn = (column: string, index: number) => {
    const stats = columnStats.find(stat => stat.columnName === column)

    return (
      <Draggable key={column} draggableId={column} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`
              inline-flex items-center space-x-2 px-3 py-1 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing
              ${snapshot.isDragging ? 'shadow-md ring-2 ring-[#F6CF62] rotate-1' : 'hover:shadow-sm border-gray-200'}
            `}
          >
            <BarChart3 className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium">{column}</span>
            {showStats && stats && (
              <Badge variant="outline" className="text-xs">
                {stats.completeness}%
              </Badge>
            )}
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <div className="space-y-4">


      {/* Validation Alerts */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validation.errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}


      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        {/* Main Mapping Interface */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Field Mapping</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Source Columns */}
              <div className="lg:col-span-1">
                <h4 className="font-medium text-sm mb-3 text-gray-700">Available Columns</h4>
                <Droppable droppableId="source-columns" isDropDisabled={true}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[100px] p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex flex-wrap gap-2">
                        {getUnmappedColumns().map((column, index) =>
                          renderDraggableColumn(column, index)
                        )}
                      </div>
                      {provided.placeholder}

                      {getUnmappedColumns().length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-sm">All columns mapped!</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Mapping Fields */}
              <div className="lg:col-span-2">
                <h4 className="font-medium text-sm mb-3 text-gray-700">YLS Fields</h4>
                <div className="space-y-2">
                  {/* Required Fields */}
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2">Required Fields</p>
                    <div className="space-y-1">
                      {requiredFields.map(renderFieldRow)}
                    </div>
                  </div>

                  {/* Optional Fields (Collapsible) */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start p-2">
                        <ChevronRight className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium text-gray-600">
                          Optional Fields
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-2">
                      {optionalFields.map(renderFieldRow)}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DragDropContext>

      {/* Data Preview */}
      {showPreview && (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">#</th>
                    {YLS_FIELDS.filter(f => mappedFields[f.key]).map(field => (
                      <th key={field.key} className="text-left p-2 font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappingData.previewData.slice(0, 3).map((record, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{index + 1}</td>
                      {YLS_FIELDS.filter(f => mappedFields[f.key]).map(field => {
                        const mappedColumn = mappedFields[field.key]
                        const value = mappedColumn ? record[mappedColumn] : '—'
                        return (
                          <td key={field.key} className="p-2">
                            {value || '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}