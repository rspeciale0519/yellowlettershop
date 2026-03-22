"use client"

import React, { useState, useEffect } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  RefreshCw, 
  Download,
  FileCheck,
  XCircle,
  Clock
} from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { useToast } from '@/components/ui/use-toast'

interface ValidationProgress {
  stage: 'preparing' | 'uploading' | 'validating' | 'processing' | 'complete' | 'error'
  progress: number
  message: string
  recordsProcessed?: number
  totalRecords?: number
}

export function AccuZipValidationStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const { toast } = useToast()
  const [validationProgress, setValidationProgress] = useState<ValidationProgress>({
    stage: 'preparing',
    progress: 0,
    message: 'Ready to validate addresses'
  })
  const [isValidating, setIsValidating] = useState(false)

  const startValidation = async () => {
    if (!orderState.columnMapping) {
      toast({
        title: "Cannot validate",
        description: "Column mapping is required before address validation.",
        variant: "destructive"
      })
      return
    }

    setIsValidating(true)
    setValidationProgress({
      stage: 'preparing',
      progress: 10,
      message: 'Preparing data for validation...'
    })

    try {
      // Step 1: Prepare data
      await new Promise(resolve => setTimeout(resolve, 1000))
      setValidationProgress({
        stage: 'uploading',
        progress: 25,
        message: 'Uploading to AccuZip...'
      })

      // Step 2: Upload to AccuZip
      const uploadResponse = await fetch('/api/accuzip/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          columnMapping: orderState.columnMapping,
          listData: orderState.listData
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload data to AccuZip')
      }

      const uploadResult = await uploadResponse.json()
      
      setValidationProgress({
        stage: 'validating',
        progress: 50,
        message: 'AccuZip is validating addresses...',
        totalRecords: uploadResult.totalRecords
      })

      // Step 3: Poll for validation results
      let validationComplete = false
      let attempts = 0
      const maxAttempts = 30 // 5 minutes max

      while (!validationComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
        attempts++

        const statusResponse = await fetch(`/api/accuzip/status/${uploadResult.jobId}`)
        if (!statusResponse.ok) {
          throw new Error('Failed to check validation status')
        }

        const statusResult = await statusResponse.json()
        
        if (statusResult.status === 'complete') {
          validationComplete = true
          
          setValidationProgress({
            stage: 'processing',
            progress: 90,
            message: 'Processing validation results...'
          })

          // Get the full validation results
          const resultsResponse = await fetch(`/api/accuzip/results/${uploadResult.jobId}`)
          if (!resultsResponse.ok) {
            throw new Error('Failed to retrieve validation results')
          }

          const validationResults = await resultsResponse.json()

          updateOrderState({
            accuzipValidation: validationResults
          })

          setValidationProgress({
            stage: 'complete',
            progress: 100,
            message: 'Address validation complete!'
          })

          toast({
            title: "Validation complete",
            description: `${validationResults.deliverableRecords} of ${validationResults.totalRecords} addresses are deliverable.`
          })

        } else if (statusResult.status === 'error') {
          throw new Error(statusResult.error || 'AccuZip validation failed')
        } else {
          // Still processing
          const progressPercent = Math.min(50 + (attempts * 1.5), 85)
          setValidationProgress({
            stage: 'validating',
            progress: progressPercent,
            message: `Validating addresses... (${statusResult.processed || 0}/${uploadResult.totalRecords})`,
            recordsProcessed: statusResult.processed,
            totalRecords: uploadResult.totalRecords
          })
        }
      }

      if (!validationComplete) {
        throw new Error('Validation timed out. Please try again.')
      }

    } catch (error) {
      console.error('AccuZip validation error:', error)
      setValidationProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Validation failed'
      })
      
      toast({
        title: "Validation failed",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive"
      })
    } finally {
      setIsValidating(false)
    }
  }

  const downloadReport = async () => {
    if (!orderState.accuzipValidation) return

    try {
      const response = await fetch(`/api/accuzip/report/${orderState.accuzipValidation.orderId}`)
      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `accuzip-validation-report-${orderState.accuzipValidation.orderId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download validation report.",
        variant: "destructive"
      })
    }
  }

  const canProceed = () => {
    return orderState.accuzipValidation && 
           orderState.accuzipValidation.deliverableRecords > 0
  }

  const getValidationIcon = () => {
    switch (validationProgress.stage) {
      case 'complete':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />
      case 'preparing':
      case 'uploading':
      case 'validating':
      case 'processing':
        return <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      default:
        return <MapPin className="h-8 w-8 text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Address Validation</h2>
        <p className="text-gray-600">
          USPS CASS-certified address validation via AccuZip
        </p>
      </div>

      {/* Validation Process Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            {getValidationIcon()}
            <span>USPS Address Validation</span>
          </CardTitle>
          <CardDescription>
            Ensure your mail pieces reach their intended destinations with CASS-certified validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!orderState.accuzipValidation && !isValidating && (
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Validate</h3>
              <p className="text-gray-600 mb-6">
                Click below to start USPS address validation for your mailing list
              </p>
              <Button onClick={startValidation} size="lg">
                <MapPin className="h-4 w-4 mr-2" />
                Start Address Validation
              </Button>
            </div>
          )}

          {isValidating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{validationProgress.message}</span>
                <span>{validationProgress.progress}%</span>
              </div>
              <Progress value={validationProgress.progress} className="w-full" />
              
              {validationProgress.recordsProcessed && validationProgress.totalRecords && (
                <p className="text-sm text-gray-600 text-center">
                  Processing {validationProgress.recordsProcessed} of {validationProgress.totalRecords} records
                </p>
              )}
            </div>
          )}

          {orderState.accuzipValidation && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {orderState.accuzipValidation.totalRecords}
                  </div>
                  <div className="text-sm text-blue-800">Total Records</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {orderState.accuzipValidation.deliverableRecords}
                  </div>
                  <div className="text-sm text-green-800">Deliverable</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {orderState.accuzipValidation.undeliverableRecords}
                  </div>
                  <div className="text-sm text-red-800">Undeliverable</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    CASS Certified
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Validated on {new Date(orderState.accuzipValidation.validatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}

          {validationProgress.stage === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {validationProgress.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5" />
            <span>What is CASS Certification?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>CASS (Coding Accuracy Support System)</strong> is the USPS process that ensures 
              address accuracy and completeness for mail automation discounts.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Benefits:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Higher delivery rates</li>
                  <li>Postal discounts eligibility</li>
                  <li>Standardized addresses</li>
                  <li>ZIP+4 code completion</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">What gets validated:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Street address accuracy</li>
                  <li>City and state verification</li>
                  <li>ZIP code validation</li>
                  <li>Apartment/suite numbers</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning for low deliverable count */}
      {orderState.accuzipValidation && orderState.accuzipValidation.deliverableRecords === 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            No deliverable addresses found. Please review your data and try again, or contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      {orderState.accuzipValidation && 
       orderState.accuzipValidation.deliverableRecords > 0 && 
       orderState.accuzipValidation.deliverableRecords < orderState.accuzipValidation.totalRecords * 0.8 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Only {Math.round((orderState.accuzipValidation.deliverableRecords / orderState.accuzipValidation.totalRecords) * 100)}% 
            of your addresses are deliverable. Consider reviewing undeliverable addresses in the validation report.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={previousStep}>
          Back
        </Button>
        <Button 
          onClick={nextStep}
          disabled={!canProceed()}
        >
          Continue to Contact Cards
        </Button>
      </div>
    </div>
  )
}