"use client"

import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select, SelectSeparator } from "@/components/ui/select"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import type React from "react"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Plus, FileText, CheckCircle2 } from "lucide-react"
import { useTags } from "@/hooks/use-tags"
import { findBestMatch } from "@/utils/string-similarity"

interface AddListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (newList: any) => void
}

// Define the predefined field options
const PREDEFINED_FIELDS = [
  { id: "firstName", label: "First Name" },
  { id: "lastName", label: "Last Name" },
  { id: "address", label: "Address" },
  { id: "city", label: "City" },
  { id: "state", label: "State" },
  { id: "zipCode", label: "Zip Code" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
]

// Define column mapping type with match confidence
interface ColumnMapping {
  fieldId: string // predefined field id, "custom", "keep", or "ignore"
  customName?: string // only used when fieldId is "custom"
  confidence?: number // confidence score for automatic matching
}

export function AddListModal({ open, onOpenChange, onSuccess }: AddListModalProps) {
  const [activeTab, setActiveTab] = useState("upload")
  const [listName, setListName] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [columnMappings, setColumnMappings] = useState<Record<string, ColumnMapping>>({})
  const [previewData, setPreviewData] = useState<string[][]>([])
  const [manualRecords, setManualRecords] = useState<Record<string, string>[]>([
    { firstName: "", lastName: "", address: "", city: "", state: "", zipCode: "" },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [customFieldNames, setCustomFieldNames] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { tags } = useTags()

  const resetForm = () => {
    setListName("")
    setSelectedTags([])
    setFile(null)
    setColumnMappings({})
    setPreviewData([])
    setManualRecords([{ firstName: "", lastName: "", address: "", city: "", state: "", zipCode: "" }])
    setActiveTab("upload")
    setShowPreview(false)
    setCustomFieldNames({})
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      handleFileSelect(droppedFile)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Function to automatically match columns
  const autoMatchColumns = (headers: string[]) => {
    const newMappings: Record<string, ColumnMapping> = {}
    const predefinedLabels = PREDEFINED_FIELDS.map((f) => f.label)

    headers.forEach((header) => {
      // Try to find the best match among predefined fields
      const { match, similarity } = findBestMatch(header, predefinedLabels)

      // Get the field ID from the matched label
      const matchedField = PREDEFINED_FIELDS.find((f) => f.label === match)

      // If similarity is high enough, use the predefined field, otherwise exclude column
      const fieldId = similarity >= 70 && matchedField ? matchedField.id : "ignore"

      newMappings[header] = {
        fieldId,
        customName: fieldId === "custom" ? header : undefined,
        confidence: similarity, // Store the confidence score
      }

      if (fieldId === "custom") {
        setCustomFieldNames((prev) => ({ ...prev, [header]: header }))
      }
    })

    return newMappings
  }

  const handleFileSelect = (selectedFile: File) => {
    // Check file size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("File is too large. Maximum size is 50MB.")
      return
    }

    // Check file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    if (!validTypes.includes(selectedFile.type)) {
      alert("Invalid file type. Please upload a CSV or Excel file.")
      return
    }

    setFile(selectedFile)

    // In a real implementation, we would parse the file here
    // and set up column mappings and preview data
    // For this example, we'll use mock data

    // Mock column headers - using more realistic headers to demonstrate matching
    const mockHeaders = [
      "First Name",
      "Last Name",
      "Street Address",
      "City Name",
      "ST",
      "Postal Code",
      "Email Address",
      "Phone Number",
      "Custom Field 1",
    ]

    // Mock preview data (first 5 rows)
    const mockPreviewData = [
      ["John", "Doe", "123 Main St", "New York", "NY", "10001", "john@example.com", "555-123-4567", "Value 1"],
      ["Jane", "Smith", "456 Oak Ave", "Los Angeles", "CA", "90001", "jane@example.com", "555-234-5678", "Value 2"],
      ["Bob", "Johnson", "789 Pine Rd", "Chicago", "IL", "60601", "bob@example.com", "555-345-6789", "Value 3"],
      ["Alice", "Williams", "321 Elm Blvd", "Houston", "TX", "77001", "alice@example.com", "555-456-7890", "Value 4"],
      ["Charlie", "Brown", "654 Maple Dr", "Phoenix", "AZ", "85001", "charlie@example.com", "555-567-8901", "Value 5"],
    ]

    // Auto-match columns
    const initialMappings = autoMatchColumns(mockHeaders)

    setColumnMappings(initialMappings)
    setPreviewData([mockHeaders, ...mockPreviewData])
  }

  const handleAddManualRecord = () => {
    setManualRecords([...manualRecords, { firstName: "", lastName: "", address: "", city: "", state: "", zipCode: "" }])
  }

  const handleRemoveManualRecord = (index: number) => {
    setManualRecords(manualRecords.filter((_, i) => i !== index))
  }

  const handleManualRecordChange = (index: number, field: string, value: string) => {
    const updatedRecords = [...manualRecords]
    updatedRecords[index] = { ...updatedRecords[index], [field]: value }
    setManualRecords(updatedRecords)
  }

  const handleCustomFieldNameChange = (header: string, value: string) => {
    setCustomFieldNames((prev) => ({ ...prev, [header]: value }))

    // Update the column mapping to reflect the new custom name
    setColumnMappings((prev) => ({
      ...prev,
      [header]: {
        ...prev[header],
        customName: value,
      },
    }))
  }

  const handleFieldTypeChange = (header: string, fieldId: string) => {
    setColumnMappings((prev) => {
      const newMapping = {
        ...prev[header],
        fieldId,
        // Set appropriate customName based on fieldId
        customName: fieldId === "custom" ? customFieldNames[header] || header : fieldId === "keep" ? header : undefined,
      }

      return { ...prev, [header]: newMapping }
    })

    // Initialize custom field name if switching to custom
    if (fieldId === "custom" && !customFieldNames[header]) {
      setCustomFieldNames((prev) => ({ ...prev, [header]: header }))
    }
  }

  const getEffectiveFieldName = (header: string) => {
    const mapping = columnMappings[header]
    if (!mapping) return header

    if (mapping.fieldId === "ignore") return "Ignored"
    if (mapping.fieldId === "custom") return mapping.customName || header
    if (mapping.fieldId === "keep") return header

    const field = PREDEFINED_FIELDS.find((f) => f.id === mapping.fieldId)
    return field ? field.label : header
  }

  const handleSubmit = async () => {
    if (!listName.trim()) {
      alert("Please enter a list name")
      return
    }

    setIsSubmitting(true)

    try {
      // In a real implementation, this would be an API call to create the list
      // For this example, we'll simulate a successful response

      // Create a mock list object
      const newList = {
        id: `new-${Date.now()}`,
        name: listName,
        recordCount: activeTab === "upload" ? 5000 : manualRecords.length,
        createdAt: new Date().toISOString(),
        tags: tags?.filter((tag) => selectedTags.includes(tag.id)) || [],
        campaigns: [],
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSuccess(newList)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating list:", error)
      alert("Failed to create list. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm()
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Add New Mailing List</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., NY Leads 2025"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Tags (Optional)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags
                  ?.filter((tag) => selectedTags.includes(tag.id))
                  .map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                      {tag.name}
                      <button
                        onClick={() => setSelectedTags(selectedTags.filter((id) => id !== tag.id))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Tag
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {tags
                      ?.filter((tag) => !selectedTags.includes(tag.id))
                      .map((tag) => (
                        <DropdownMenuItem key={tag.id} onClick={() => setSelectedTags([...selectedTags, tag.id])}>
                          {tag.name}
                        </DropdownMenuItem>
                      ))}
                    {(!tags || tags.filter((tag) => !selectedTags.includes(tag.id)).length === 0) && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No more tags available</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 pt-4">
              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                  } cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xls,.xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <h3 className="font-medium text-lg">Drag & Drop File</h3>
                    <p className="text-sm text-muted-foreground mb-4">Supported formats: CSV, Excel (.xls, .xlsx)</p>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the parent div's onClick
                        triggerFileInput()
                      }}
                    >
                      Select File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
                      <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        setColumnMappings({})
                        setPreviewData([])
                        setCustomFieldNames({})
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Column Mapping</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Map columns from your uploaded file to our predefined fields
                      </p>

                      <div className="border rounded-md">
                        <div className="bg-muted px-4 py-2 flex">
                          <div className="w-1/2 font-medium text-sm">Uploaded Column Headers</div>
                          <div className="w-1/2 font-medium text-sm">Map To Predefined Fields</div>
                        </div>

                        {previewData[0]?.map((header, index) => {
                          const mapping = columnMappings[header] || {
                            fieldId: "custom",
                            customName: header,
                          }

                          // Determine if this was an automatic match
                          const isAutoMatched =
                            mapping.fieldId !== "custom" &&
                            mapping.fieldId !== "keep" &&
                            mapping.fieldId !== "ignore" &&
                            mapping.confidence &&
                            mapping.confidence >= 70

                          // Get confidence level styling
                          const getConfidenceStyle = () => {
                            if (!mapping.confidence) return ""
                            if (mapping.confidence >= 90) return "text-green-600"
                            if (mapping.confidence >= 80) return "text-green-500"
                            if (mapping.confidence >= 70) return "text-yellow-600"
                            return "text-yellow-500"
                          }

                          return (
                            <div key={index} className="flex border-t px-4 py-3 items-center">
                              {/* Left column - Uploaded header */}
                              <div className="w-1/2 pr-4">
                                <div className="font-medium">{header}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Sample: {previewData[1]?.[index] || ""}
                                </div>
                              </div>

                              {/* Right column - Mapping options */}
                              <div className="w-1/2">
                                <div className="flex items-center">
                                  <div className="w-[calc(100%-2.5rem)]">
                                    <Select
                                      value={mapping.fieldId}
                                      onValueChange={(value) => handleFieldTypeChange(header, value)}
                                    >
                                      <SelectTrigger
                                        id={`field-type-${index}`}
                                        className={`w-full ${isAutoMatched ? "border-primary" : ""}`}
                                      >
                                        <SelectValue placeholder="Select field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="custom">Use Custom Field Name</SelectItem>
                                        <SelectItem value="keep">Keep Original Name</SelectItem>
                                        <SelectItem value="ignore">Exclude This Column</SelectItem>
                                        <SelectSeparator />
                                        {PREDEFINED_FIELDS.map((field) => (
                                          <SelectItem key={field.id} value={field.id}>
                                            {field.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-10 flex justify-center">
                                    {isAutoMatched ? (
                                      <div
                                        className="flex items-center"
                                        title={`Auto-matched with ${mapping.confidence?.toFixed(0)}% confidence`}
                                      >
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                {mapping.fieldId === "custom" && (
                                  <div className="mt-2">
                                    <Input
                                      value={customFieldNames[header] || ""}
                                      onChange={(e) => handleCustomFieldNameChange(header, e.target.value)}
                                      placeholder="Enter custom field name"
                                      size="sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="w-full">
                        {showPreview ? "Hide Preview" : "Show Preview"}
                      </Button>

                      {showPreview && (
                        <div className="mt-4 space-y-2">
                          <h3 className="font-medium">Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            First 5 rows of your data with current mappings
                          </p>

                          <div className="border rounded-md">
                            <div
                              className="overflow-x-auto"
                              style={{
                                scrollbarWidth: "thin",
                                WebkitOverflowScrolling: "touch",
                                maxWidth: "100%",
                              }}
                            >
                              <table className="w-full text-sm" style={{ minWidth: "100%", tableLayout: "auto" }}>
                                <thead className="bg-muted sticky top-0 z-10">
                                  <tr>
                                    {previewData[0]?.map((header, index) => {
                                      const mapping = columnMappings[header]
                                      const isIgnored = mapping?.fieldId === "ignore"
                                      const isCustom = mapping?.fieldId === "custom"
                                      const isKeep = mapping?.fieldId === "keep"
                                      const isPredefined = !isIgnored && !isCustom && !isKeep

                                      return (
                                        <th
                                          key={index}
                                          className={`px-4 py-2 text-left font-medium whitespace-nowrap ${isIgnored ? "text-muted-foreground line-through" : ""}`}
                                        >
                                          <div className="flex items-center gap-1">
                                            {header}
                                            {isIgnored && <X className="h-3 w-3 text-red-500" />}
                                          </div>
                                          <div
                                            className={`text-xs font-normal mt-1 ${
                                              isIgnored
                                                ? "text-red-500"
                                                : isCustom
                                                  ? "text-blue-500"
                                                  : isKeep
                                                    ? "text-green-500"
                                                    : "text-primary"
                                            }`}
                                          >
                                            {isIgnored ? "Excluded" : <>↓ {getEffectiveFieldName(header)}</>}
                                          </div>
                                        </th>
                                      )
                                    })}
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {previewData.slice(1, 6).map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                      {row.map((cell, cellIndex) => {
                                        const header = previewData[0][cellIndex]
                                        const mapping = columnMappings[header]
                                        const isIgnored = mapping?.fieldId === "ignore"

                                        return (
                                          <td
                                            key={cellIndex}
                                            className={`px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis ${isIgnored ? "text-muted-foreground line-through" : ""}`}
                                          >
                                            {cell}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Manual Record Entry</h3>
                  <Button variant="outline" size="sm" onClick={handleAddManualRecord}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Record
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Enter records manually by filling out the fields below</p>
              </div>

              <div className="space-y-4">
                {manualRecords.map((record, index) => (
                  <div key={index} className="border rounded-md p-4 relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveManualRecord(index)}
                      disabled={manualRecords.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`firstName-${index}`} className="text-sm">
                          First Name
                        </Label>
                        <Input
                          id={`firstName-${index}`}
                          value={record.firstName}
                          onChange={(e) => handleManualRecordChange(index, "firstName", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`lastName-${index}`} className="text-sm">
                          Last Name
                        </Label>
                        <Input
                          id={`lastName-${index}`}
                          value={record.lastName}
                          onChange={(e) => handleManualRecordChange(index, "lastName", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`address-${index}`} className="text-sm">
                          Address
                        </Label>
                        <Input
                          id={`address-${index}`}
                          value={record.address}
                          onChange={(e) => handleManualRecordChange(index, "address", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`city-${index}`} className="text-sm">
                          City
                        </Label>
                        <Input
                          id={`city-${index}`}
                          value={record.city}
                          onChange={(e) => handleManualRecordChange(index, "city", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`state-${index}`} className="text-sm">
                          State
                        </Label>
                        <Input
                          id={`state-${index}`}
                          value={record.state}
                          onChange={(e) => handleManualRecordChange(index, "state", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`zipCode-${index}`} className="text-sm">
                          Zip Code
                        </Label>
                        <Input
                          id={`zipCode-${index}`}
                          value={record.zipCode}
                          onChange={(e) => handleManualRecordChange(index, "zipCode", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Add List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
