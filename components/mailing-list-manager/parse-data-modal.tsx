"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ColumnDef } from "./customizable-table"

interface ParseDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef[]
  onApplyParse: (options: any) => void
}

export function ParseDataModal({ open, onOpenChange, columns, onApplyParse }: ParseDataModalProps) {
  // State for source column
  const [sourceColumn, setSourceColumn] = useState<string>("")

  // State for parse type
  const [parseType, setParseType] = useState<string>("name")

  // State for target columns
  const [targetColumns, setTargetColumns] = useState<{ [key: string]: string }>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })

  // State for record selection
  const [recordSelection, setRecordSelection] = useState<string>("all")

  // State for additional options
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [autoClose, setAutoClose] = useState(false)

  // Handle target column selection
  const handleTargetColumnChange = (field: string, columnId: string) => {
    setTargetColumns((prev) => ({
      ...prev,
      [field]: columnId,
    }))
  }

  // Handle parse apply
  const handleApplyParse = () => {
    onApplyParse({
      sourceColumn,
      parseType,
      targetColumns,
      recordSelection,
      overwriteExisting,
      includeDeleted,
      autoClose,
    })

    if (autoClose) {
      onOpenChange(false)
    }
  }

  // Filter columns to only include text columns
  const textColumns = columns.filter(
    (column) => column.id !== "select" && column.id !== "actions" && column.id !== "campaigns" && column.id !== "tags",
  )

  // Get parse type options
  const parseTypeOptions = [
    { value: "name", label: "Full Name (First Last)" },
    { value: "nameReverse", label: "Full Name (Last, First)" },
    { value: "address", label: "Full Address" },
    { value: "cityStateZip", label: "City, State ZIP" },
    { value: "custom", label: "Custom Pattern" },
  ]

  // Determine which target fields to show based on parse type
  const getTargetFields = () => {
    switch (parseType) {
      case "name":
      case "nameReverse":
        return ["firstName", "lastName"]
      case "address":
        return ["address"]
      case "cityStateZip":
        return ["city", "state", "zipCode"]
      case "custom":
        return ["firstName", "lastName", "address", "city", "state", "zipCode"]
      default:
        return []
    }
  }

  const targetFieldLabels: { [key: string]: string } = {
    firstName: "First Name",
    lastName: "Last Name",
    address: "Address",
    city: "City",
    state: "State",
    zipCode: "ZIP Code",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Parse Data</DialogTitle>
          <DialogDescription>Extract data from one field into multiple fields.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-6 py-4">
          <div>
            <Label htmlFor="source-column">Source Field</Label>
            <Select value={sourceColumn} onValueChange={setSourceColumn}>
              <SelectTrigger id="source-column" className="w-full">
                <SelectValue placeholder="Select source field" />
              </SelectTrigger>
              <SelectContent>
                {textColumns.map((column) => {
                  const columnName =
                    typeof column.header === "string"
                      ? column.header
                      : column.id.charAt(0).toUpperCase() + column.id.slice(1)

                  return (
                    <SelectItem key={column.id} value={column.id}>
                      {columnName}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="parse-type">Parse Type</Label>
            <Select value={parseType} onValueChange={setParseType}>
              <SelectTrigger id="parse-type" className="w-full">
                <SelectValue placeholder="Select parse type" />
              </SelectTrigger>
              <SelectContent>
                {parseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-medium">Target Fields</Label>
            <p className="text-sm text-muted-foreground mb-2">Select where to store the parsed data.</p>

            <div className="space-y-4 mt-2">
              {getTargetFields().map((field) => (
                <div key={field} className="grid grid-cols-2 gap-4 items-center">
                  <Label htmlFor={`target-${field}`}>{targetFieldLabels[field]}</Label>
                  <Select
                    value={targetColumns[field]}
                    onValueChange={(value) => handleTargetColumnChange(field, value)}
                  >
                    <SelectTrigger id={`target-${field}`}>
                      <SelectValue placeholder={`Select ${targetFieldLabels[field]} field`} />
                    </SelectTrigger>
                    <SelectContent>
                      {textColumns.map((column) => {
                        const columnName =
                          typeof column.header === "string"
                            ? column.header
                            : column.id.charAt(0).toUpperCase() + column.id.slice(1)

                        return (
                          <SelectItem key={column.id} value={column.id}>
                            {columnName}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {parseType === "custom" && (
            <div>
              <Label htmlFor="custom-pattern">Custom Pattern</Label>
              <Input id="custom-pattern" placeholder="e.g., {firstName} {lastName}" className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">Use {"{fieldName}"} to define extraction patterns</p>
            </div>
          )}

          <div>
            <Label className="text-base font-medium">Record Selection</Label>
            <RadioGroup value={recordSelection} onValueChange={setRecordSelection} className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selection" id="selection" />
                <Label htmlFor="selection">Selected Records</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Records</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite-existing"
                checked={overwriteExisting}
                onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
              />
              <Label htmlFor="overwrite-existing">Overwrite Existing Data</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-deleted"
                checked={includeDeleted}
                onCheckedChange={(checked) => setIncludeDeleted(checked === true)}
              />
              <Label htmlFor="include-deleted">Include Deleted Records</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-close"
                checked={autoClose}
                onCheckedChange={(checked) => setAutoClose(checked === true)}
              />
              <Label htmlFor="auto-close">Auto Close</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyParse}
            disabled={!sourceColumn || getTargetFields().some((field) => !targetColumns[field])}
          >
            Parse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
