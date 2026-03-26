"use client"

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { ColumnMappingData, MappingValidation, YLS_FIELDS } from './types'

interface DataPreviewProps {
  mappingData: ColumnMappingData
  validation: MappingValidation
}

export function DataPreview({ mappingData, validation }: DataPreviewProps) {
  const { mappedFields, previewData } = mappingData

  // Transform preview data according to current mapping
  const transformedData = useMemo(() => {
    return previewData.map((record, index) => {
      const transformed: any = { _originalIndex: index }
      
      Object.entries(mappedFields).forEach(([ylsField, sourceColumn]) => {
        if (sourceColumn && record[sourceColumn] !== undefined) {
          transformed[ylsField] = record[sourceColumn]
        } else {
          transformed[ylsField] = null
        }
      })
      
      return transformed
    })
  }, [mappedFields, previewData])

  // Get mapped YLS fields for display
  const mappedYlsFields = Object.entries(mappedFields)
    .filter(([, sourceColumn]) => sourceColumn !== null)
    .map(([ylsField]) => ylsField)

  const getFieldInfo = (fieldKey: string) => {
    return YLS_FIELDS.find(f => f.key === fieldKey)
  }

  const getFieldStatus = (fieldKey: string, value: any) => {
    const fieldInfo = getFieldInfo(fieldKey)
    if (!fieldInfo) return 'unknown'
    
    if (value === null || value === undefined || value === '') {
      return fieldInfo.required ? 'error' : 'empty'
    }
    
    // Basic validation based on field type
    switch (fieldInfo.type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'valid' : 'warning'
      case 'phone':
        return /^\+?[\d\s\-\(\)]{10,}$/.test(value) ? 'valid' : 'warning'
      case 'number':
        return !isNaN(parseFloat(value)) ? 'valid' : 'warning'
      default:
        return 'valid'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-700 bg-green-50'
      case 'warning':
        return 'text-yellow-700 bg-yellow-50'
      case 'error':
        return 'text-red-700 bg-red-50'
      case 'empty':
        return 'text-gray-500 bg-gray-50'
      default:
        return 'text-gray-700 bg-gray-50'
    }
  }

  if (mappedYlsFields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No fields mapped yet</p>
        <p className="text-sm">Map some fields to see a preview of your data</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">


      {/* Data Preview Table */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Sample Data</h4>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  {mappedYlsFields.map(fieldKey => {
                    const fieldInfo = getFieldInfo(fieldKey)
                    return (
                      <th key={fieldKey} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        <div className="flex items-center space-x-1">
                          <span>{fieldInfo?.label}</span>
                          {fieldInfo?.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transformedData.slice(0, 5).map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    {mappedYlsFields.map(fieldKey => {
                      const value = record[fieldKey]
                      const status = getFieldStatus(fieldKey, value)
                      const displayValue = value || '—'
                      
                      return (
                        <td key={fieldKey} className="px-3 py-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                              {displayValue}
                            </span>
                            {getStatusIcon(status)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {transformedData.length > 5 && (
          <p className="text-xs text-gray-500 text-center py-2">
            Showing first 5 of {transformedData.length} records
          </p>
        )}
      </div>

    </div>
  )
}