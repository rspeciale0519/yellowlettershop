'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColumnMappingStep } from './ColumnMappingStep'
import { Button } from '@/components/ui/button'
import { Upload, File, CheckCircle } from 'lucide-react'
import { OrderState } from '@/types/orders'
import { useRef, useState } from 'react'
import { ManualEntryForm } from './ManualEntryForm'

interface DataSourceDetailsSectionProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hasListData: boolean
  orderState: OrderState
  onFileUpload?: (file: File) => void
  onDataComplete?: (listData: any) => void
}

export function DataSourceDetailsSection({
  activeTab,
  onTabChange,
  hasListData,
  orderState,
  onFileUpload,
  onDataComplete
}: DataSourceDetailsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleFileSelect = (file: File) => {
    if (onFileUpload) {
      onFileUpload(file)
      // Reset hover state after successful upload
      setIsHovering(false)
      setIsDragActive(false)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleChooseFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleAreaClick = () => {
    handleChooseFileClick()
  }

  // Only show the section if a data source has been selected
  const currentSource = orderState.dataAndMapping?.listData?.source || orderState.listData?.source
  const uploadedFile = orderState.dataAndMapping?.listData?.uploadedFile || orderState.listData?.uploadedFile

  if (!currentSource) {
    return null
  }

  return (
    <div className="mt-8">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="select-data-source">1. Select Data Source</TabsTrigger>
          <TabsTrigger
            value="map-columns"
            disabled={!hasListData}
          >
            2. Map Columns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="select-data-source" className="space-y-4">
          {currentSource === 'upload' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium">Upload Your Mailing List</h4>

              {uploadedFile ? (
                // Success state - show uploaded file
                <div className="border-2 border-dashed border-green-400 bg-green-50 rounded-lg p-8 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-600" />
                  <p className="mb-2 text-green-700 font-medium">File uploaded successfully!</p>
                  <p className="text-sm text-green-600 mb-4">{uploadedFile.name}</p>
                  <Button
                    variant="outline"
                    onClick={handleChooseFileClick}
                    className="border-green-400 text-green-700 hover:bg-green-100"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Choose Different File
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                // Upload state
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                    ${isDragActive || isHovering
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                  onClick={handleAreaClick}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <Upload className={`h-8 w-8 mx-auto mb-4 ${isDragActive || isHovering ? 'text-yellow-600' : 'text-gray-400'}`} />
                  <p className={`mb-4 ${isDragActive || isHovering ? 'text-yellow-700' : 'text-gray-600'}`}>
                    {isDragActive ? 'Drop your file here' : 'Drag and drop your CSV or Excel file here'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleChooseFileClick()
                    }}
                    className={isDragActive || isHovering ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-100' : ''}
                  >
                    <File className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {currentSource === 'existing' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium">Select Existing List</h4>
              <p className="text-muted-foreground">Choose from your saved mailing lists.</p>
            </div>
          )}

          {currentSource === 'manual' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium">Enter Recipients Manually</h4>
              <ManualEntryForm
                records={
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (orderState.dataAndMapping?.listData as any)?.manualRecords ??
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (orderState.listData as any)?.manualRecords ??
                  []
                }
                onRecordsChange={(records) => {
                  // Normalize camelCase → snake_case for AccuZip compatibility
                  const normalized = records.map(r => ({
                    first_name: (r as any).firstName,
                    last_name: (r as any).lastName,
                    address_line_1: (r as any).addressLine1,
                    address_line_2: (r as any).addressLine2,
                    city: (r as any).city,
                    state: (r as any).state,
                    zip_code: (r as any).zipCode,
                    id: (r as any).id
                  }))
                  onDataComplete?.({
                    source: 'manual',
                    useMailingData: true,
                    dataSource: 'manual_entry',
                    manualRecords: normalized,
                    totalRecords: records.length
                  })
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="map-columns" className="space-y-4">
          <ColumnMappingStep orderState={orderState} onUpdateState={() => {}} onNext={() => {}} onBack={() => {}} onSaveDraft={() => {}} validation={{}} />
        </TabsContent>
      </Tabs>
    </div>
  )
}