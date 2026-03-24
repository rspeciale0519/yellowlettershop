"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, MapPin, FileText, AlertCircle } from 'lucide-react'
import { UndeliverablePanel } from './UndeliverablePanel'

export function AddressValidationStep({ orderState, onUpdateState }: OrderStepProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pollInterval])

  const validationResults = orderState.addressValidation || orderState.accuzipValidation

  const getDataSource = () => {
    const listData = orderState.dataAndMapping?.listData || orderState.listData
    if (listData?.uploadedFile) {
      return { type: 'file', name: listData.uploadedFile.name }
    } else if (listData?.selectedListId) {
      return { type: 'list', name: 'Selected Mailing List' }
    } else if (listData?.manualRecords?.length) {
      return { type: 'manual', name: `${listData.manualRecords.length} manual records` }
    }
    return { type: 'unknown', name: 'Unknown data source' }
  }

  const buildListDataPayload = () => {
    const listData = orderState.dataAndMapping?.listData || orderState.listData
    if (!listData) return null

    if (listData.dataSource === 'upload' && listData.uploadedFile) {
      return { source: 'upload' as const }
    } else if (listData.dataSource === 'mlm_select' && listData.selectedListId) {
      return { source: 'saved_list' as const, mailingListId: listData.selectedListId }
    } else if (listData.dataSource === 'manual_entry' && listData.manualRecords?.length) {
      return {
        source: 'list_builder' as const,
        records: listData.manualRecords.map(r => ({ ...r }))
      }
    }
    return null
  }

  const handleStartValidation = async () => {
    const listData = orderState.dataAndMapping?.listData || orderState.listData
    if (!listData) {
      setValidationError('No list data found. Please complete Step 1 first.')
      return
    }

    const listDataPayload = buildListDataPayload()
    if (!listDataPayload) {
      setValidationError('Cannot determine data source. Please complete Step 1 first.')
      return
    }

    setIsValidating(true)
    setValidationError(null)
    onUpdateState({ addressValidation: undefined, accuzipValidation: undefined })

    try {
      const columnMapping = orderState.dataAndMapping?.columnMapping ?? orderState.columnMapping ?? {}
      const uploadBody = { columnMapping, listData: listDataPayload }

      const uploadRes = await fetch('/api/accuzip/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadBody)
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error((err as { message?: string }).message ?? 'Upload failed')
      }

      const { jobId: newJobId } = await uploadRes.json() as { jobId: string }
      setJobId(newJobId)

      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/accuzip/status/${newJobId}`)
          const status = await statusRes.json() as {
            status: string
            totalRecords?: number
          }

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval)
            setPollInterval(null)

            if (status.status === 'failed') {
              setIsValidating(false)
              setValidationError('Validation failed. Please try again.')
              return
            }

            const resultsRes = await fetch(`/api/accuzip/results/${newJobId}`)
            if (!resultsRes.ok) throw new Error('Failed to fetch results')

            const results = await resultsRes.json() as {
              deliverableRecords: number
              undeliverableRecords: number
              totalRecords: number
              validatedAt: string
              cassCertified: boolean
              records: unknown[]
              orderId: string
              summary?: unknown
            }

            onUpdateState({
              accuzipValidation: {
                deliverableRecords: results.deliverableRecords,
                undeliverableRecords: results.undeliverableRecords,
                totalRecords: results.totalRecords,
                validatedAt: new Date(results.validatedAt),
                validationReport: [],
                orderId: results.orderId ?? newJobId
              },
              addressValidation: {
                deliverableRecords: results.deliverableRecords,
                undeliverableRecords: results.undeliverableRecords,
                totalRecords: results.totalRecords,
                validatedAt: new Date(results.validatedAt),
                validationReport: [],
                orderId: results.orderId ?? newJobId
              }
            })
            setIsValidating(false)
          }
        } catch {
          clearInterval(interval)
          setPollInterval(null)
          setIsValidating(false)
          setValidationError('Error checking validation status. Please try again.')
        }
      }, 3000)

      setPollInterval(interval)

    } catch (err) {
      setIsValidating(false)
      setValidationError(err instanceof Error ? err.message : 'Validation failed')
    }
  }

  const dataSource = getDataSource()
  const totalRecords = validationResults?.totalRecords ?? 0
  const deliverableCount = validationResults?.deliverableRecords ?? 0
  const undeliverableCount = validationResults?.undeliverableRecords ?? 0
  const deliveryRate = totalRecords > 0 ? Math.round((deliverableCount / totalRecords) * 100 * 10) / 10 : 0
  const isComplete = Boolean(validationResults)

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Address Validation</h2>
        <p className="text-gray-600">
          Validate and standardize addresses using CASS-certified AccuZip service
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Data Source</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="outline">{dataSource.type}</Badge>
              <span className="text-sm text-gray-600">{dataSource.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>AccuZip Address Validation</span>
          </CardTitle>
          <CardDescription>
            CASS-certified address validation and standardization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isComplete && !isValidating && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Address validation is required before proceeding. This ensures maximum deliverability
                  and reduces returned mail.
                </AlertDescription>
              </Alert>
              <div className="text-center py-8">
                <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Validate Addresses</h3>
                <p className="text-gray-600 mb-6">
                  Click below to start the address validation process
                </p>
                <Button onClick={handleStartValidation} size="lg">
                  Start Address Validation
                </Button>
              </div>
            </div>
          )}

          {isValidating && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <MapPin className="w-12 h-12 mx-auto text-blue-500 mb-3 animate-pulse" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Validating Addresses</h3>
                <p className="text-gray-600">This may take a moment...</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Validating addresses...</span>
                  <span className="text-muted-foreground">Processing</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse w-full" />
                </div>
              </div>
            </div>
          )}

          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {validationError}
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2"
                  onClick={() => {
                    setValidationError(null)
                    handleStartValidation()
                  }}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isComplete && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Address validation completed successfully. Your mailing list is ready for processing.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {totalRecords.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {deliverableCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Deliverable</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {undeliverableCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Undeliverable</div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {deliveryRate}% Delivery Rate
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Addresses have been standardized and verified via CASS-certified AccuZip.
                </p>
              </div>

              {undeliverableCount > 0 && (
                <UndeliverablePanel
                  jobId={jobId}
                  undeliverableCount={undeliverableCount}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
