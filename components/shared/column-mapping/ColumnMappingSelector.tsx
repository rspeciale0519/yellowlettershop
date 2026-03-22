"use client"

import React from 'react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X, AlertCircle } from 'lucide-react'
import { ColumnMappingData, YLS_FIELDS } from './types'

interface ColumnMappingSelectorProps {
  mappingData: ColumnMappingData
  onMappingChange: (ylsField: string, sourceColumn: string | null) => void
  onClearAllMappings?: () => void
}

export function ColumnMappingSelector({
  mappingData,
  onMappingChange,
  onClearAllMappings
}: ColumnMappingSelectorProps) {
  const { sourceColumns, mappedFields } = mappingData

  const getAvailableColumns = (currentField: string) => {
    // Get columns that are not already mapped to other fields
    const usedColumns = Object.entries(mappedFields)
      .filter(([field, column]) => field !== currentField && column !== null)
      .map(([, column]) => column)
    
    return sourceColumns.filter(col => !usedColumns.includes(col))
  }

  const clearMapping = (ylsField: string) => {
    onMappingChange(ylsField, null)
  }

  const requiredFieldsSection = YLS_FIELDS.filter(field => field.required)
  const optionalFieldsSection = YLS_FIELDS.filter(field => !field.required)

  const renderFieldMapping = (field: typeof YLS_FIELDS[0]) => {
    const currentMapping = mappedFields[field.key]
    const availableColumns = getAvailableColumns(field.key)
    const isMapped = currentMapping !== null
    const isRequired = field.required

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor={`mapping-${field.key}`} className="text-sm font-medium">
              {field.label}
            </Label>
            {isRequired && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                Required
              </Badge>
            )}
            {!isMapped && isRequired && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
          {isMapped && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearMapping(field.key)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Select
          value={currentMapping || '__unmapped__'}
          onValueChange={(value) => onMappingChange(field.key, value === '__unmapped__' ? null : value)}
        >
          <SelectTrigger 
            id={`mapping-${field.key}`}
            className={`w-full ${!isMapped && isRequired ? 'border-red-300 bg-red-50' : ''}`}
          >
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unmapped__">-- Not mapped --</SelectItem>
            {availableColumns.map(column => (
              <SelectItem key={column} value={column}>
                {column}
              </SelectItem>
            ))}
            {/* Show currently mapped column even if it would normally be filtered out */}
            {currentMapping && !availableColumns.includes(currentMapping) && (
              <SelectItem value={currentMapping}>
                {currentMapping} (currently mapped)
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Required Fields Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          Required Fields
          <Badge variant="destructive" className="ml-2 text-xs">
            Must Map All
          </Badge>
        </h3>
        <div className="space-y-4">
          {requiredFieldsSection.map(renderFieldMapping)}
        </div>
      </div>

      {/* Optional Fields Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          Optional Fields
          <Badge variant="secondary" className="ml-2 text-xs">
            Recommended
          </Badge>
        </h3>
        <div className="space-y-4">
          {optionalFieldsSection.map(renderFieldMapping)}
        </div>
      </div>

      {/* Source Columns Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Available Columns ({sourceColumns.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {sourceColumns.map(column => {
            const isMapped = Object.values(mappedFields).includes(column)
            return (
              <Badge 
                key={column} 
                variant={isMapped ? "default" : "outline"}
                className="text-xs"
              >
                {column}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (onClearAllMappings) {
              onClearAllMappings()
            } else {
              // Fallback: Clear all mappings
              YLS_FIELDS.forEach(field => {
                onMappingChange(field.key, null)
              })
            }
          }}
        >
          Clear All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Auto-map based on field names
            const autoMapping: Record<string, string | null> = {}
            YLS_FIELDS.forEach(field => {
              autoMapping[field.key] = null
            })
            
            // Simple auto-mapping logic
            sourceColumns.forEach(sourceCol => {
              const normalizedSource = sourceCol.toLowerCase().trim()
              const matchedField = YLS_FIELDS.find(field => {
                const fieldVariations = [
                  field.key.toLowerCase(),
                  field.label.toLowerCase().replace(/\s+/g, '_'),
                  field.label.toLowerCase().replace(/\s+/g, '')
                ]
                return fieldVariations.some(variation => 
                  normalizedSource.includes(variation) || variation.includes(normalizedSource)
                )
              })
              
              if (matchedField && !Object.values(autoMapping).includes(sourceCol)) {
                autoMapping[matchedField.key] = sourceCol
              }
            })

            // Apply auto-mapping
            Object.entries(autoMapping).forEach(([field, column]) => {
              onMappingChange(field, column)
            })
          }}
        >
          Auto-Map
        </Button>
      </div>
    </div>
  )
}