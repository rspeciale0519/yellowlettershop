"use client"

import React from 'react'
import { Progress } from '@/components/ui/progress'

interface ImportProgressProps {
  importStatus: 'idle' | 'parsing' | 'importing' | 'complete' | 'error'
  importProgress: number
}

export function ImportProgress({ importStatus, importProgress }: ImportProgressProps) {
  if (importStatus === 'idle') return null

  const getStatusMessage = () => {
    switch (importStatus) {
      case 'parsing':
        return 'Parsing CSV file...'
      case 'importing':
        return 'Importing records...'
      case 'complete':
        return 'Import complete!'
      case 'error':
        return 'Import failed'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{getStatusMessage()}</span>
        <span>{importProgress}%</span>
      </div>
      <Progress value={importProgress} className="h-2" />
    </div>
  )
}