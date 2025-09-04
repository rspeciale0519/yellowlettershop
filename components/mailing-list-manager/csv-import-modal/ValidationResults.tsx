"use client"

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ImportResults {
  total: number
  imported: number
  failed: number
  duplicates: number
}

interface ValidationResultsProps {
  importResults: ImportResults | null
  importStatus: 'idle' | 'parsing' | 'importing' | 'complete' | 'error'
}

export function ValidationResults({ importResults, importStatus }: ValidationResultsProps) {
  if (!importResults) {
    if (importStatus === 'error') {
      return (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>Import failed. No results to display.</AlertDescription>
        </Alert>
      )
    }
    return null
  }

  return (
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
  )
}