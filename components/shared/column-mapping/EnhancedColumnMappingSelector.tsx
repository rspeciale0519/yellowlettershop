"use client"

import React, { useState, useCallback } from 'react'
import { DragDropColumnMapping } from './DragDropColumnMapping'
import { ColumnMappingSelector } from './ColumnMappingSelector'
import { StreamlinedColumnMapping } from './StreamlinedColumnMapping'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { GripHorizontal, List, Save, Download } from 'lucide-react'
import {
  ColumnMappingData,
  MappingValidation,
  MappingHistory,
  ColumnStatistics,
  MappingTemplate,
  YLS_FIELDS
} from './types'
import { analyzeColumnData, performSmartAutoMapping } from './utils'

interface EnhancedColumnMappingSelectorProps {
  mappingData: ColumnMappingData
  onMappingChange: (ylsField: string, sourceColumn: string | null) => void
  onBulkMappingChange?: (newMappedFields: Record<string, string | null>) => void
  validation: MappingValidation
  showTemplates?: boolean
  onSaveTemplate?: (template: Omit<MappingTemplate, 'id' | 'createdAt' | 'usageCount'>) => void
  onLoadTemplate?: (template: MappingTemplate) => void
  templates?: MappingTemplate[]
  useStreamlined?: boolean
  useDragDrop?: boolean
  showStats?: boolean
}

export function EnhancedColumnMappingSelector({
  mappingData,
  onMappingChange,
  onBulkMappingChange,
  validation,
  showTemplates = false,
  onSaveTemplate,
  onLoadTemplate,
  templates = [],
  useStreamlined = true,
  useDragDrop = true,
  showStats = false
}: EnhancedColumnMappingSelectorProps) {
  const [history, setHistory] = useState<MappingHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [columnStats, setColumnStats] = useState<ColumnStatistics[]>([])

  // Initialize column statistics
  React.useEffect(() => {
    if (mappingData.previewData && mappingData.previewData.length > 0) {
      const stats = analyzeColumnData(mappingData.previewData)
      setColumnStats(stats)
    }
  }, [mappingData.previewData])

  // Enhanced mapping change handler with history tracking
  const handleMappingChangeWithHistory = useCallback(
    (ylsField: string, sourceColumn: string | null) => {
      const oldValue = mappingData.mappedFields[ylsField]

      // Don't record if no actual change
      if (oldValue === sourceColumn) return

      // Create history entry
      const historyEntry: MappingHistory = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        action: sourceColumn ? 'map' : 'unmap',
        fieldKey: ylsField,
        oldValue,
        newValue: sourceColumn
      }

      // Truncate history after current index and add new entry
      const newHistory = [...history.slice(0, historyIndex + 1), historyEntry]
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      // Apply the change
      onMappingChange(ylsField, sourceColumn)
    },
    [mappingData.mappedFields, history, historyIndex, onMappingChange]
  )

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex >= 0 && historyIndex < history.length) {
      const entry = history[historyIndex]

      if (!entry) {
        console.warn('Undo: History entry not found at index', historyIndex)
        return
      }

      if (entry.fieldKey === '__bulk__') {
        // Handle bulk operations (auto-map, clear-all)
        const oldMappings = JSON.parse(entry.oldValue)
        if (onBulkMappingChange) {
          onBulkMappingChange(oldMappings)
        } else {
          Object.entries(oldMappings).forEach(([field, value]) => {
            onMappingChange(field, value as string | null)
          })
        }
      } else {
        // Handle single field operations
        onMappingChange(entry.fieldKey, entry.oldValue)
      }

      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, onMappingChange, onBulkMappingChange])

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1]

      if (!entry) {
        console.warn('Redo: History entry not found at index', historyIndex + 1)
        return
      }

      if (entry.fieldKey === '__bulk__') {
        // Handle bulk operations (auto-map, clear-all)
        const newMappings = JSON.parse(entry.newValue)
        if (onBulkMappingChange) {
          onBulkMappingChange(newMappings)
        } else {
          Object.entries(newMappings).forEach(([field, value]) => {
            onMappingChange(field, value as string | null)
          })
        }
      } else {
        // Handle single field operations
        onMappingChange(entry.fieldKey, entry.newValue)
      }

      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, onMappingChange, onBulkMappingChange])

  // Smart auto-mapping
  const handleSmartAutoMap = useCallback(() => {
    const newMappings = performSmartAutoMapping(
      mappingData.sourceColumns,
      columnStats,
      mappingData.mappedFields
    )

    // Record bulk auto-map action
    const historyEntry: MappingHistory = {
      id: `${Date.now()}-auto-map`,
      timestamp: Date.now(),
      action: 'auto-map',
      fieldKey: '__bulk__',
      oldValue: JSON.stringify(mappingData.mappedFields),
      newValue: JSON.stringify(newMappings)
    }

    const newHistory = [...history.slice(0, historyIndex + 1), historyEntry]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Apply all changes
    Object.entries(newMappings).forEach(([field, column]) => {
      if (mappingData.mappedFields[field] !== column) {
        onMappingChange(field, column)
      }
    })
  }, [mappingData, columnStats, history, historyIndex, onMappingChange])

  // Clear all mappings with history tracking
  const handleClearAllMappings = useCallback(() => {
    const clearedMappings: Record<string, string | null> = {}
    YLS_FIELDS.forEach(field => {
      clearedMappings[field.key] = null
    })

    // Record bulk clear action
    const historyEntry: MappingHistory = {
      id: `${Date.now()}-clear-all`,
      timestamp: Date.now(),
      action: 'clear-all',
      fieldKey: '__bulk__',
      oldValue: JSON.stringify(mappingData.mappedFields),
      newValue: JSON.stringify(clearedMappings)
    }

    const newHistory = [...history.slice(0, historyIndex + 1), historyEntry]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Apply bulk change if function is available
    if (onBulkMappingChange) {
      onBulkMappingChange(clearedMappings)
    } else {
      // Fallback to individual changes
      YLS_FIELDS.forEach(field => {
        if (mappingData.mappedFields[field.key]) {
          onMappingChange(field.key, null)
        }
      })
    }
  }, [mappingData.mappedFields, history, historyIndex, onMappingChange, onBulkMappingChange])

  // Save template
  const handleSaveTemplate = useCallback(() => {
    if (!onSaveTemplate) return

    const templateName = prompt('Enter a name for this mapping template:')
    if (!templateName) return

    const template = {
      name: templateName,
      description: `Template for ${mappingData.sourceColumns.length} columns`,
      mappings: { ...mappingData.mappedFields }
    }

    onSaveTemplate(template)
  }, [mappingData, onSaveTemplate])

  // Export mappings
  const handleExportMappings = useCallback(() => {
    const exportData = {
      mappings: mappingData.mappedFields,
      sourceColumns: mappingData.sourceColumns,
      timestamp: new Date().toISOString(),
      statistics: columnStats
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
  }, [mappingData, columnStats])

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="space-y-6">

      {/* Templates Section */}
      {showTemplates && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onLoadTemplate?.(template)}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {template.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Used {template.usageCount} times
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Mapping Interface */}
      {useStreamlined ? (
        <StreamlinedColumnMapping
          mappingData={mappingData}
          onMappingChange={handleMappingChangeWithHistory}
          onClearAllMappings={handleClearAllMappings}
          validation={validation}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSaveTemplate={showTemplates ? handleSaveTemplate : undefined}
          columnStats={columnStats}
          showStats={showStats}
        />
      ) : useDragDrop ? (
        <DragDropColumnMapping
          mappingData={mappingData}
          onMappingChange={handleMappingChangeWithHistory}
          onClearAllMappings={handleClearAllMappings}
          validation={validation}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSaveTemplate={showTemplates ? handleSaveTemplate : undefined}
          columnStats={columnStats}
        />
      ) : (
        <ColumnMappingSelector
          mappingData={mappingData}
          onMappingChange={handleMappingChangeWithHistory}
          onClearAllMappings={handleClearAllMappings}
        />
      )}
    </div>
  )
}