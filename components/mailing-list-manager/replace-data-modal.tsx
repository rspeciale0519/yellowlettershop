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

interface ReplaceDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef[]
  onApplyReplace: (options: any) => void
}

export function ReplaceDataModal({ open, onOpenChange, columns, onApplyReplace }: ReplaceDataModalProps) {
  // State for selected columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  // State for search and replace
  const [searchText, setSearchText] = useState<string>("")
  const [replaceText, setReplaceText] = useState<string>("")

  // State for record selection
  const [recordSelection, setRecordSelection] = useState<string>("all")

  // State for additional options
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [matchWholeWord, setMatchWholeWord] = useState(false)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [autoClose, setAutoClose] = useState(false)

  // Handle column selection
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  // Handle replace apply
  const handleApplyReplace = () => {
    onApplyReplace({
      columns: selectedColumns,
      searchText,
      replaceText,
      recordSelection,
      caseSensitive,
      matchWholeWord,
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
          <DialogTitle>Replace Data</DialogTitle>
          <DialogDescription>Find and replace text in selected fields.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search-text">Search For</Label>
              <Input
                id="search-text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Text to find"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="replace-text">Replace With</Label>
              <Input
                id="replace-text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement text"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Field List</Label>
            <p className="text-sm text-muted-foreground mb-2">Select the fields to search and replace text in.</p>

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
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked === true)}
              />
              <Label htmlFor="case-sensitive">Case Sensitive</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="match-whole-word"
                checked={matchWholeWord}
                onCheckedChange={(checked) => setMatchWholeWord(checked === true)}
              />
              <Label htmlFor="match-whole-word">Match Whole Word</Label>
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
          <Button onClick={handleApplyReplace} disabled={selectedColumns.length === 0 || !searchText.trim()}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
