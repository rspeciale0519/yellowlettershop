"use client"

import React from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertTriangle, MapPin, FileText, Clock, AlertCircle } from 'lucide-react'
export function AddressValidationStep({ orderState, onUpdateState }: OrderStepProps) {

  // Mock validation data - in real implementation this would come from AccuZip API
  const validationResults = orderState.addressValidation || orderState.accuzipValidation

  const mockValidation = {
    totalRecords: 1250,
    deliverableRecords: 1180,
    undeliverableRecords: 70,
    deliveryRate: 94.4,
    isComplete: Boolean(validationResults),
    inProgress: false
  }

  const handleStartValidation = async () => {
    // In real implementation, this would call AccuZip API
    onUpdateState({
      addressValidation: {
        totalRecords: mockValidation.totalRecords,
        deliverableRecords: mockValidation.deliverableRecords,
        undeliverableRecords: mockValidation.undeliverableRecords,
        validationReport: [],
        orderId: orderState.orderId || 'temp-order-id',
        validatedAt: new Date()
      },
      // Legacy support
      accuzipValidation: {
        totalRecords: mockValidation.totalRecords,
        deliverableRecords: mockValidation.deliverableRecords,
        undeliverableRecords: mockValidation.undeliverableRecords,
        validationReport: [],
        orderId: orderState.orderId || 'temp-order-id',
        validatedAt: new Date()
      }
    })
  }

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

  const dataSource = getDataSource()
  const canProceed = mockValidation.isComplete

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Address Validation</h2>
        <p className="text-gray-600">
          Validate and standardize addresses using CASS-certified AccuZip service
        </p>
      </div>

      {/* Data Source Summary */}
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
            <div className="text-sm text-gray-500">
              {mockValidation.totalRecords.toLocaleString()} records
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
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
        <CardContent>
          {!mockValidation.isComplete && !mockValidation.inProgress && (
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

          {mockValidation.inProgress && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Validating Addresses</h3>
                <p className="text-gray-600 mb-6">
                  Processing {mockValidation.totalRecords.toLocaleString()} addresses...
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="w-full" />
              </div>
            </div>
          )}

          {mockValidation.isComplete && (
            <div className="space-y-6">
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
                      {mockValidation.totalRecords.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {mockValidation.deliverableRecords.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Deliverable</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {mockValidation.undeliverableRecords.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Undeliverable</div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {mockValidation.deliveryRate}% Delivery Rate
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Excellent delivery rate! Your addresses have been standardized and verified.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}