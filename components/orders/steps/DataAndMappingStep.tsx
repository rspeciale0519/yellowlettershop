"use client"

import React, { useState, useEffect, useRef } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileText, AlertCircle, CheckCircle, ArrowRight, Upload, Users, Database } from 'lucide-react'
import { ColumnMappingStep } from './ColumnMappingStep'
import { DataSourceSelectionButtons } from './DataSourceSelectionButtons'
import { DataSourceDetailsSection } from './DataSourceDetailsSection'

export function DataAndMappingStep({ orderState, onUpdateState }: OrderStepProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'mapping'>('data')

  // Determine if we have list data configured
  const hasListData = Boolean(
    orderState.dataAndMapping?.listData?.uploadedFile ||
    orderState.dataAndMapping?.listData?.selectedListId ||
    orderState.dataAndMapping?.listData?.manualRecords?.length ||
    orderState.dataAndMapping?.listData?.melissaDataCriteria ||
    orderState.listData?.uploadedFile ||
    orderState.listData?.selectedListId ||
    orderState.listData?.manualRecords?.length ||
    orderState.listData?.melissaDataCriteria
  )

  // Determine if column mapping is complete
  const hasMappingComplete = Boolean(
    orderState.dataAndMapping?.columnMapping?.isComplete ||
    orderState.columnMapping?.isComplete
  )

  // Reset to data tab if no data is available
  useEffect(() => {
    if (!hasListData && activeTab === 'mapping') {
      setActiveTab('data')
    }
  }, [hasListData, activeTab])

  const canProceed = hasListData && hasMappingComplete

  const handleDataComplete = (listData: any) => {
    // Update the consolidated structure
    onUpdateState({
      dataAndMapping: {
        listData,
        columnMapping: orderState.dataAndMapping?.columnMapping
      },
      // Also update legacy structure for compatibility
      listData
    })

    // Don't auto-advance - let user click Continue or manually switch tabs
  }

  const handleMappingComplete = (columnMapping: any) => {
    // Update the consolidated structure with isComplete flag
    const updatedColumnMapping = {
      ...columnMapping,
      isComplete: true
    }

    onUpdateState({
      dataAndMapping: {
        listData: orderState.dataAndMapping?.listData || orderState.listData,
        columnMapping: updatedColumnMapping
      },
      // Also update legacy structure for compatibility
      columnMapping: updatedColumnMapping
    })

    // Don't auto-advance - let user click Continue button to proceed
  }

  const handleFileUpload = (file: File) => {
    // Validate file type (same as ListDataStep)
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload a CSV or Excel file')
      return
    }

    // Create file upload data structure with actual File object
    const uploadData = {
      source: 'upload',
      useMailingData: true,
      dataSource: 'file_upload',
      uploadedFile: file  // Store the actual File object, not just metadata
    }

    // Update state with file information
    handleDataComplete(uploadData)

    console.log('File uploaded successfully:', file.name)
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Data & Mapping</h2>
        <p className="text-gray-600">
          Select your data source and map columns to YLS fields
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Configure Your Mailing Data</span>
          </CardTitle>
          <CardDescription>
            Choose your data source and complete the mapping process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSourceSelectionButtons
            orderState={orderState}
            onDataComplete={handleDataComplete}
          />

          <DataSourceDetailsSection
            activeTab={activeTab === 'data' ? 'select-data-source' : 'map-columns'}
            onTabChange={(tab) => setActiveTab(tab === 'select-data-source' ? 'data' : 'mapping')}
            hasListData={hasListData}
            orderState={orderState}
            onFileUpload={handleFileUpload}
            onDataComplete={handleDataComplete}
          />
        </CardContent>
      </Card>

    </div>
  )
}

// Data Source Selection Component
function DataSourceSelection({ orderState, onDataComplete }: {
  orderState: any,
  onDataComplete: (listData: any) => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentListData = orderState.dataAndMapping?.listData || orderState.listData || { useMailingData: true }

  const handleDataSourceChange = (dataSource: 'upload' | 'mlm_select' | 'manual_entry') => {
    const updatedListData = {
      ...currentListData,
      dataSource
    }
    onDataComplete(updatedListData)
  }

  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      alert('Please upload a CSV or Excel file')
      return
    }

    const updatedListData = {
      ...currentListData,
      dataSource: 'upload' as const,
      uploadedFile: file
    }
    onDataComplete(updatedListData)
  }

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Source Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Choose Your Data Source</h3>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {/* File Upload Option */}
          <Button
            variant={currentListData.dataSource === 'upload' ? 'default' : 'outline'}
            className="h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => handleDataSourceChange('upload')}
          >
            <Upload className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium text-sm">Upload File</div>
              <div className="text-xs opacity-75">CSV or Excel</div>
            </div>
          </Button>

          {/* Existing List Option */}
          <Button
            variant={currentListData.dataSource === 'mlm_select' ? 'default' : 'outline'}
            className="h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => handleDataSourceChange('mlm_select')}
          >
            <Database className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium text-sm">Existing List</div>
              <div className="text-xs opacity-75">From Manager</div>
            </div>
          </Button>

          {/* Manual Entry Option */}
          <Button
            variant={currentListData.dataSource === 'manual_entry' ? 'default' : 'outline'}
            className="h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => handleDataSourceChange('manual_entry')}
          >
            <Users className="h-6 w-6" />
            <div className="text-center">
              <div className="font-medium text-sm">Manual Entry</div>
              <div className="text-xs opacity-75">Type recipients</div>
            </div>
          </Button>
        </div>
      </div>

      {/* File Upload Interface */}
      {currentListData.dataSource === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Mailing List</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing your mailing list data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-[#F6CF62] bg-[#F6CF62]/10' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {currentListData.uploadedFile ? (
                <div>
                  <p className="text-green-600 font-medium">
                    File uploaded: {currentListData.uploadedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Size: {(currentListData.uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const updatedListData = { ...currentListData, uploadedFile: undefined }
                      onDataComplete(updatedListData)
                    }}
                  >
                    Upload Different File
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supports CSV and Excel files up to 50MB
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleBrowseClick}
                    className="cursor-pointer"
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing List Selection Placeholder */}
      {currentListData.dataSource === 'mlm_select' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Existing list selection interface will be integrated here.
          </AlertDescription>
        </Alert>
      )}

      {/* Manual Entry Placeholder */}
      {currentListData.dataSource === 'manual_entry' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Manual entry interface will be integrated here.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}