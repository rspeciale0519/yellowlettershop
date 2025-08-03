"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ColumnDef } from "./customizable-table"

interface FillDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef[]
  onApplyFill: (options: any) => void
}

export function FillDataModal({ open, onOpenChange, columns, onApplyFill }: FillDataModalProps) {
  // State for selected columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  // State for fill value
  const [fillValue, setFillValue] = useState<string>("")

  // State for record selection
  const [recordSelection, setRecordSelection] = useState<string>("all")

  // State for additional options
  const [onlyEmptyFields, setOnlyEmptyFields] = useState(true)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [autoClose, setAutoClose] = useState(false)

  // Handle column selection
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  // Handle fill apply
  const handleApplyFill = () => {
    onApplyFill({
      columns: selectedColumns,
      fillValue,
      recordSelection,
      onlyEmptyFields,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Fill Data</DialogTitle>
          <DialogDescription>Fill empty or all fields with a specified value.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
          <div>
            <Label className="text-base font-medium">Fill Value</Label>
            <p className="text-sm text-muted-foreground mb-2">Enter the value to fill into the selected fields.</p>
            <Input
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              placeholder="Value to fill"
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-base font-medium">Field List</Label>
            <p className="text-sm text-muted-foreground mb-2">Select the fields you want to fill.</p>

            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-4 space-y-2">
                {textColumns.map((column) => {
                  const columnName =
                    typeof column.header === "string"
                      ? column.header
                      : column.id.charAt(0).toUpperCase() + column.id.slice(1)

                  return (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${column.id}`}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => toggleColumnSelection(column.id)}
                      />
                      <Label htmlFor={`column-${column.id}`}>{columnName}</Label>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

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
                id="only-empty"
                checked={onlyEmptyFields}
                onCheckedChange={(checked) => setOnlyEmptyFields(checked === true)}
              />
              <Label htmlFor="only-empty">Only Fill Empty Fields</Label>
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
          <Button onClick={handleApplyFill} disabled={selectedColumns.length === 0 || !fillValue.trim()}>
            Fill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
