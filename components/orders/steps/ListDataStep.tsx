"use client"

import React, { useState, useEffect, useRef } from 'react'
import { OrderStepProps } from '@/types/orders'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Users, Database, FileText, Plus, X, CheckCircle, Loader2 } from 'lucide-react'
import { useOrderWorkflow } from '../OrderProvider'
import { getMailingLists } from '@/lib/supabase/mailing-lists'
import { smoothScrollToElementWithDelay } from '@/lib/utils'
import type { MailingList } from '@/types/mailing-lists'

export function ListDataStep({ orderState }: OrderStepProps) {
  const { updateOrderState, nextStep } = useOrderWorkflow()
  const [dragActive, setDragActive] = useState(false)
  const [manualRecords, setManualRecords] = useState(orderState.listData.manualRecords || [])
  const [mailingLists, setMailingLists] = useState<MailingList[]>([])
  const [loadingLists, setLoadingLists] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load mailing lists when component mounts
  useEffect(() => {
    loadMailingLists()
  }, [])

  const loadMailingLists = async () => {
    try {
      setLoadingLists(true)
      setListError(null)
      const lists = await getMailingLists()
      setMailingLists(lists.filter(list => list.is_active && list.record_count > 0))
    } catch (error) {
      console.error('Error loading mailing lists:', error)
      setListError('Failed to load mailing lists')
    } finally {
      setLoadingLists(false)
    }
  }

  const handleListSelection = (listId: string) => {
    const selectedList = mailingLists.find(list => list.id === listId)
    updateOrderState({
      listData: {
        ...orderState.listData,
        selectedListId: listId,
        selectedListName: selectedList?.name
      }
    })
  }

  const handleUseMailingDataChange = (value: string) => {
    const useMailingData = value === 'yes'
    updateOrderState({
      listData: {
        ...orderState.listData,
        useMailingData,
        dataSource: useMailingData ? undefined : undefined
      }
    })
  }

  const handleDataSourceChange = (dataSource: 'upload' | 'mlm_select' | 'manual_entry' | 'melissa_data') => {
    updateOrderState({
      listData: {
        ...orderState.listData,
        dataSource
      }
    })

    // Smooth scroll to the form area after state update using reusable utility
    smoothScrollToElementWithDelay(`${dataSource}-form`)
  }

  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      alert('Please upload a CSV or Excel file')
      return
    }

    updateOrderState({
      listData: {
        ...orderState.listData,
        uploadedFile: file
      }
    })
  }

  const handleBrowseClick = () => {
    // Try the ref approach first
    if (fileInputRef.current) {
      fileInputRef.current.click()
      return
    }
    
    // Fallback for browsers that might have issues with refs
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
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

  const addManualRecord = () => {
    const newRecord = {
      first_name: '',
      last_name: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      email: '',
      phone: '',
      company: ''
    }
    const updatedRecords = [...manualRecords, newRecord]
    setManualRecords(updatedRecords)
    updateOrderState({
      listData: {
        ...orderState.listData,
        manualRecords: updatedRecords
      }
    })
  }

  const updateManualRecord = (index: number, field: string, value: string) => {
    const updatedRecords = manualRecords.map((record, i) => 
      i === index ? { ...record, [field]: value } : record
    )
    setManualRecords(updatedRecords)
    updateOrderState({
      listData: {
        ...orderState.listData,
        manualRecords: updatedRecords
      }
    })
  }

  const removeManualRecord = (index: number) => {
    const updatedRecords = manualRecords.filter((_, i) => i !== index)
    setManualRecords(updatedRecords)
    updateOrderState({
      listData: {
        ...orderState.listData,
        manualRecords: updatedRecords
      }
    })
  }

  const canProceed = () => {
    if (!orderState.listData.useMailingData) {
      return true // Can proceed to contact cards without mailing data
    }

    if (!orderState.listData.dataSource) {
      return false
    }

    switch (orderState.listData.dataSource) {
      case 'upload':
        return !!orderState.listData.uploadedFile
      case 'mlm_select':
        return !!orderState.listData.selectedListId
      case 'manual_entry':
        return manualRecords.length > 0 && manualRecords.every(r => 
          r.first_name && r.last_name && r.address_line_1 && r.city && r.state && r.zip_code
        )
      case 'melissa_data':
        return !!orderState.listData.melissaDataCriteria
      default:
        return false
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Mailing List Data</h2>
        <p className="text-gray-600">
          Choose whether to use mailing list data for personalization or create a static mail piece
        </p>
      </div>

      {/* Use Mailing Data Decision */}
      <Card>
        <CardHeader>
          <CardTitle>Personalization Options</CardTitle>
          <CardDescription>
            Mailing list data allows you to personalize each mail piece with recipient information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={orderState.listData.useMailingData ? 'yes' : 'no'}
            onValueChange={handleUseMailingDataChange}
            className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="use-data-yes" />
                <Label htmlFor="use-data-yes" className="font-medium">
                  Yes, use mailing list data for personalization
                </Label>
              </div>
              <div className="ml-6 text-xs text-gray-600 mt-1">
                Personalize each mail piece with recipient information
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="use-data-no" />
                <Label htmlFor="use-data-no" className="font-medium">
                  No, create a static mail piece
                </Label>
              </div>
              <div className="ml-6 text-xs text-gray-600 mt-1">
                Same design for all recipients
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Data Source Selection */}
      {orderState.listData.useMailingData && (
        <Card>
          <CardHeader>
            <CardTitle>Select Data Source</CardTitle>
            <CardDescription>
              Choose how you want to provide your mailing list data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* File Upload Option */}
              <Button
                variant={orderState.listData.dataSource === 'upload' ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handleDataSourceChange('upload')}
              >
                <Upload className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">Upload File</div>
                  <div className="text-xs opacity-75">CSV or Excel</div>
                </div>
              </Button>

              {/* Mailing List Manager Option */}
              <Button
                variant={orderState.listData.dataSource === 'mlm_select' ? 'default' : 'outline'}
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
                variant={orderState.listData.dataSource === 'manual_entry' ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handleDataSourceChange('manual_entry')}
              >
                <Users className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">Manual Entry</div>
                  <div className="text-xs opacity-75">Type recipients</div>
                </div>
              </Button>

              {/* List Builder Option */}
              <Button
                variant={orderState.listData.dataSource === 'melissa_data' ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => handleDataSourceChange('melissa_data')}
                disabled // Will be enabled when MelissaData integration is complete
              >
                <FileText className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">Build List</div>
                  <div className="text-xs opacity-75">
                    <Badge variant="secondary" className="text-xs px-1 py-0">Coming Soon</Badge>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Interface */}
      {orderState.listData.dataSource === 'upload' && (
        <Card id="upload-form">
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
              {orderState.listData.uploadedFile ? (
                <div>
                  <p className="text-green-600 font-medium">
                    File uploaded: {orderState.listData.uploadedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Size: {(orderState.listData.uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => updateOrderState({
                      listData: { ...orderState.listData, uploadedFile: undefined }
                    })}
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

      {/* Manual Entry Interface */}
      {orderState.listData.dataSource === 'manual_entry' && (
        <Card id="manual_entry-form">
          <CardHeader>
            <CardTitle>Manual Entry</CardTitle>
            <CardDescription>
              Enter recipient information manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {manualRecords.map((record, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Recipient {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeManualRecord(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor={`first-name-${index}`}>First Name *</Label>
                      <Input
                        id={`first-name-${index}`}
                        value={record.first_name}
                        onChange={(e) => updateManualRecord(index, 'first_name', e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`last-name-${index}`}>Last Name *</Label>
                      <Input
                        id={`last-name-${index}`}
                        value={record.last_name}
                        onChange={(e) => updateManualRecord(index, 'last_name', e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`address-${index}`}>Address *</Label>
                      <Input
                        id={`address-${index}`}
                        value={record.address_line_1}
                        onChange={(e) => updateManualRecord(index, 'address_line_1', e.target.value)}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`city-${index}`}>City *</Label>
                      <Input
                        id={`city-${index}`}
                        value={record.city}
                        onChange={(e) => updateManualRecord(index, 'city', e.target.value)}
                        placeholder="Anytown"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`state-${index}`}>State *</Label>
                      <Input
                        id={`state-${index}`}
                        value={record.state}
                        onChange={(e) => updateManualRecord(index, 'state', e.target.value)}
                        placeholder="CA"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`zip-${index}`}>ZIP Code *</Label>
                      <Input
                        id={`zip-${index}`}
                        value={record.zip_code}
                        onChange={(e) => updateManualRecord(index, 'zip_code', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={record.email}
                        onChange={(e) => updateManualRecord(index, 'email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addManualRecord}
                className="w-full flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Recipient</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing List Selection */}
      {orderState.listData.dataSource === 'mlm_select' && (
        <Card id="mlm_select-form">
          <CardHeader>
            <CardTitle>Select Existing Mailing List</CardTitle>
            <CardDescription>
              Choose from your saved mailing lists
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLists ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading your mailing lists...</span>
              </div>
            ) : listError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {listError}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-3"
                    onClick={loadMailingLists}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : mailingLists.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No active mailing lists found. Please create a mailing list first in the Mailing List Manager.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <RadioGroup
                  value={orderState.listData.selectedListId || ''}
                  onValueChange={handleListSelection}
                >
                  {mailingLists.map((list) => (
                    <div
                      key={list.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <RadioGroupItem value={list.id} id={`list-${list.id}`} />
                      <Label
                        htmlFor={`list-${list.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{list.name}</div>
                            {list.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {list.description}
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{list.record_count} records</span>
                              <span>Created {new Date(list.created_at).toLocaleDateString()}</span>
                              {list.last_used_at && (
                                <span>Last used {new Date(list.last_used_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          {orderState.listData.selectedListId === list.id && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {orderState.listData.selectedListId && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selected list will be used for your campaign. You can proceed to column mapping.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List Builder Placeholder */}
      {orderState.listData.dataSource === 'melissa_data' && (
        <Alert id="melissa_data-form">
          <AlertDescription>
            List Builder integration with MelissaData is coming soon. This will allow you to build
            targeted mailing lists based on demographics, property characteristics, and geographic criteria.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <div /> {/* Empty div for spacing */}
        <Button 
          onClick={nextStep}
          disabled={!canProceed()}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}