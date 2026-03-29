'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Clock,
  Users,
  Mail,
  Phone,
  MapPin,
  TrendingUp
} from 'lucide-react'

interface ImportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  headers: string[]
  sampleRows: string[][]
  columnMappings: Record<string, string>
  options?: {
    requireEmail?: boolean
    requirePhone?: boolean
    requireAddress?: boolean
  }
}

interface ImportPreview {
  summary: {
    totalRecords: number
    validRecords: number
    errorRecords: number
    warningRecords: number
    duplicateRecords: number
    qualityScore: number
    breakdown: {
      hasName: number
      hasEmail: number
      hasPhone: number
      hasAddress: number
      emailValid: number
      addressValid: number
    }
  }
  records: Array<{
    rowNumber: number
    data: Record<string, string>
    status: 'valid' | 'warning' | 'error'
    issues: Array<{
      field: string
      type: 'error' | 'warning' | 'info'
      message: string
      suggestion?: string
    }>
    completenessScore: number
  }>
  issues: Array<{
    type: 'critical' | 'warning' | 'info'
    category: string
    message: string
    affectedRecords: number
    suggestion: string
  }>
  recommendations: string[]
  canProceed: boolean
  estimatedTime: number
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onProceed,
  headers,
  sampleRows,
  columnMappings,
  options = {}
}: ImportPreviewModalProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && headers && sampleRows && columnMappings) {
      generatePreview()
    }
  }, [isOpen, headers, sampleRows, columnMappings])

  const generatePreview = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mailing-lists/import-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headers,
          sampleRows,
          columnMappings,
          options: {
            maxPreviewRecords: 50,
            includeValidationDetails: true,
            checkDuplicates: true,
            ...options
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate preview')
      }

      const data = await response.json()
      setPreview(data.preview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} seconds`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analyzing Import Data...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Generating preview...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Error</DialogTitle>
          </DialogHeader>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={generatePreview}>
              Retry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!preview) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Import Preview</span>
            <Badge variant={preview.canProceed ? 'default' : 'destructive'}>
              Quality Score: {preview.summary.qualityScore}%
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="issues">Issues ({preview.issues.length})</TabsTrigger>
            <TabsTrigger value="records">Records ({preview.records.length})</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Valid</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {preview.summary.validRecords}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Warnings</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {preview.summary.warningRecords}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Errors</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {preview.summary.errorRecords}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {preview.summary.totalRecords}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Completeness</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Names</span>
                    </span>
                    <span>{Math.round((preview.summary.breakdown.hasName / preview.summary.totalRecords) * 100)}%</span>
                  </div>
                  <Progress value={(preview.summary.breakdown.hasName / preview.summary.totalRecords) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Emails</span>
                    </span>
                    <span>{Math.round((preview.summary.breakdown.hasEmail / preview.summary.totalRecords) * 100)}%</span>
                  </div>
                  <Progress value={(preview.summary.breakdown.hasEmail / preview.summary.totalRecords) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phones</span>
                    </span>
                    <span>{Math.round((preview.summary.breakdown.hasPhone / preview.summary.totalRecords) * 100)}%</span>
                  </div>
                  <Progress value={(preview.summary.breakdown.hasPhone / preview.summary.totalRecords) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Addresses</span>
                    </span>
                    <span>{Math.round((preview.summary.breakdown.hasAddress / preview.summary.totalRecords) * 100)}%</span>
                  </div>
                  <Progress value={(preview.summary.breakdown.hasAddress / preview.summary.totalRecords) * 100} />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-500" />
              <span>Estimated processing time: <strong>{formatTime(preview.estimatedTime)}</strong></span>
            </div>
          </TabsContent>

          <TabsContent value="issues">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {preview.issues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No issues found! Your data looks great.</p>
                  </div>
                ) : (
                  preview.issues.map((issue, index) => (
                    <Alert key={index} className={
                      issue.type === 'critical' ? 'border-red-200 bg-red-50' :
                      issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }>
                      {getIssueIcon(issue.type)}
                      <div className="ml-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{issue.message}</span>
                          <Badge variant="outline" className="text-xs">
                            {issue.affectedRecords} records
                          </Badge>
                        </div>
                        <AlertDescription className="mt-1">
                          {issue.suggestion}
                        </AlertDescription>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="records">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {preview.records.map((record, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span className="font-medium">Row {record.rowNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {record.completenessScore}% complete
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                      {Object.entries(record.data).map(([field, value]) => (
                        <div key={field}>
                          <span className="text-gray-500">{field}:</span>
                          <span className="ml-1 font-medium">{value || 'N/A'}</span>
                        </div>
                      ))}
                    </div>

                    {record.issues.length > 0 && (
                      <div className="space-y-1">
                        {record.issues.map((issue, issueIndex) => (
                          <div key={issueIndex} className="text-sm flex items-start space-x-2">
                            {issue.type === 'error' ? (
                              <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                            ) : issue.type === 'warning' ? (
                              <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                            ) : (
                              <Info className="h-3 w-3 text-blue-500 mt-0.5" />
                            )}
                            <div>
                              <span className="font-medium">{issue.field}:</span>
                              <span className="ml-1">{issue.message}</span>
                              {issue.suggestion && (
                                <div className="text-gray-500 text-xs mt-1">
                                  💡 {issue.suggestion}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-3">
              {preview.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>{recommendation}</AlertDescription>
                </Alert>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center space-x-2">
            {preview.canProceed ? (
              <Badge className="bg-green-100 text-green-800">
                Ready to Import
              </Badge>
            ) : (
              <Badge variant="destructive">
                Fix Issues Before Import
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={onProceed} 
              disabled={!preview.canProceed}
              className={preview.canProceed ? '' : 'opacity-50 cursor-not-allowed'}
            >
              Proceed with Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
