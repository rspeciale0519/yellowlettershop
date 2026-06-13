"use client"

import React from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, AlertCircle, CheckCircle, Upload } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { ColumnMappingPage } from '@/components/shared/column-mapping/ColumnMappingPage'
import type { ColumnMappingData, YLSField } from '@/components/shared/column-mapping'
import { YLS_FIELDS } from '@/components/shared/column-mapping'
import type { ListDataSelection } from '@/types/orders'
import { persistUploadedList } from '@/lib/orders/persist-upload'

export function ColumnMappingStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep, previousStep } = useOrderWorkflow()
  const listData: ListDataSelection = orderState.listData ?? { useMailingData: false }

  const handleMappingComplete = (mappingData: ColumnMappingData) => {
    updateOrderState({
      columnMapping: mappingData
    })

    // For uploaded files, persist the full list to mailing_list_records so
    // validation + fulfillment run on real DB records. The mapping (with its
    // previewData) is kept intact as the fallback, so a persist failure never
    // breaks the existing happy path — we only *add* the resolved list id.
    const file = orderState.listData?.uploadedFile
    if (file) {
      void persistUploadedList(file, mappingData.mappedFields)
        .then((result) => {
          if (!result) return
          const baseList = orderState.listData ?? { useMailingData: true }
          updateOrderState({
            listData: {
              ...baseList,
              selectedListId: result.mailingListId,
              dataSource: 'mlm_select',
            },
          })
        })
        .catch((err) => {
          console.warn('Order upload persistence failed; using previewData fallback:', err)
        })
    }
    // Don't auto-advance - let user click Continue button to proceed
  }

  const getDataSource = () => {
    if (listData.uploadedFile) {
      return {
        type: 'file' as const,
        file: listData.uploadedFile
      }
    } else if (listData.selectedListId) {
      return {
        type: 'list' as const,
        listId: listData.selectedListId
      }
    } else if (listData.manualRecords) {
      return {
        type: 'manual' as const,
        records: listData.manualRecords
      }
    }
    return null
  }

  // Auto-create mapping for manual entries (but don't mark as complete to avoid auto-advancement)
  React.useEffect(() => {
    const dataSource = getDataSource()
    if (dataSource?.type === 'manual' && !orderState.columnMapping) {
      // Create automatic mapping for manual entries
      const mappedFields: Record<string, string | null> = {
        'first_name': 'first_name',
        'last_name': 'last_name',
        'address': 'address_line_1',
        'city': 'city',
        'state': 'state',
        'zip_code': 'zip_code',
        'email': 'email'
      }
      const autoMapping: ColumnMappingData = {
        sourceColumns: Object.keys(mappedFields),
        mappedFields,
        previewData: dataSource.records,
        requiredFields: YLS_FIELDS.filter((f: YLSField) => f.required).map((f: YLSField) => f.key),
        optionalFields: YLS_FIELDS.filter((f: YLSField) => !f.required).map((f: YLSField) => f.key),
        isComplete: false, // Don't auto-complete to prevent auto-advancement
        recordCount: dataSource.records.length
      }
      updateOrderState({
        columnMapping: autoMapping
      })
    }
  }, [orderState.columnMapping, updateOrderState])

  const dataSource = getDataSource()

  if (!dataSource) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Column Mapping</h2>
          <p className="text-gray-600">
            Map your data fields to Yellow Letter Shop variables
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data source found. Please go back and select a data source in the previous step.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={previousStep}>
            Back
          </Button>
          <Button disabled>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  const canProceed = () => {
    if (!orderState.columnMapping) {
      console.log('canProceed: No columnMapping found')
      return false
    }

    const requiredMappings = ['first_name', 'last_name', 'address_line_1', 'city', 'state', 'zip_code']
    const mappedFieldKeys = Object.keys(orderState.columnMapping.mappedFields || {})

    console.log('canProceed debug:', {
      requiredMappings,
      mappedFieldKeys,
      columnMapping: orderState.columnMapping,
      result: requiredMappings.every(field => mappedFieldKeys.includes(field))
    })

    return requiredMappings.every(field => mappedFieldKeys.includes(field))
  }

  return (
    <div className="w-full space-y-6">
      {/* Column Mapping Interface */}
      {dataSource.type === 'file' && (
        <ColumnMappingPage
          sourceFile={dataSource.file}
          onMappingComplete={handleMappingComplete}
          onCancel={previousStep}
          mode="order-workflow"
        />
      )}

      {dataSource.type === 'list' && (
        <ColumnMappingPage
          listId={dataSource.listId}
          onMappingComplete={handleMappingComplete}
          onCancel={previousStep}
          mode="order-workflow"
        />
      )}

      {dataSource.type === 'manual' && (
        <ColumnMappingPage
          sourceData={dataSource.records}
          onMappingComplete={handleMappingComplete}
          onCancel={previousStep}
          mode="order-workflow"
        />
      )}

      {/* Mapping Status */}
      {!canProceed() && orderState.columnMapping && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please map all required fields: First Name, Last Name, Address, City, State, and ZIP Code.
          </AlertDescription>
        </Alert>
      )}

    </div>
  )
}