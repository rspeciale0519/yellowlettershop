"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Trash } from "lucide-react"
import type { ColumnDef } from "./customizable-table"

interface FormatDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef[]
  onApplyFormat: (options: any) => void
  title?: string
  description?: string
}

export function FormatDataModal({
  open,
  onOpenChange,
  columns,
  onApplyFormat,
  title = "Format Data",
  description = "Apply text formatting to selected columns and records.",
}: FormatDataModalProps) {
  // State for selected columns
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  // State for format options
  const [formatOption, setFormatOption] = useState<string>("upper")

  // State for record selection
  const [recordSelection, setRecordSelection] = useState<string>("all")
  const [recordRange, setRecordRange] = useState({
    from: "1",
    to: "100",
    next: "1",
    rest: "1",
    record: "1",
  })

  // State for dictionary
  const [dictionaryEnabled, setDictionaryEnabled] = useState(false)
  const [dictionaryEntries, setDictionaryEntries] = useState<Array<{ search: string; replace: string }>>([
    { search: "JR", replace: "Jr." },
    { search: "SR", replace: "Sr." },
    { search: "inc", replace: "Inc." },
    { search: "llc", replace: "LLC" },
  ])

  // State for additional options
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [autoRun, setAutoRun] = useState(false)
  const [autoClose, setAutoClose] = useState(false)

  // Handle column selection
  const toggleColumnSelection = (columnId: string) => {
    setSelectedColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  // Handle dictionary entry add
  const addDictionaryEntry = () => {
    setDictionaryEntries([...dictionaryEntries, { search: "", replace: "" }])
  }

  // Handle dictionary entry remove
  const removeDictionaryEntry = (index: number) => {
    setDictionaryEntries(dictionaryEntries.filter((_, i) => i !== index))
  }

  // Handle dictionary entry update
  const updateDictionaryEntry = (index: number, field: "search" | "replace", value: string) => {
    const newEntries = [...dictionaryEntries]
    newEntries[index][field] = value
    setDictionaryEntries(newEntries)
  }

  // Handle format apply
  const handleApplyFormat = () => {
    onApplyFormat({
      columns: selectedColumns,
      formatOption,
      recordSelection,
      recordRange,
      dictionaryEnabled,
      dictionaryEntries,
      includeDeleted,
      autoRun,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="fields" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="options">Format Options</TabsTrigger>
            <TabsTrigger value="dictionary">Dictionary</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="fields" className="h-full overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <div className="mb-4">
                  <Label className="text-base font-medium">Field List</Label>
                  <p className="text-sm text-muted-foreground mb-2">Select the fields you want to format.</p>
                </div>

                <ScrollArea className="h-[300px] border rounded-md">
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

                <div className="mt-6">
                  <Label className="text-base font-medium">Record Selection</Label>
                  <RadioGroup value={recordSelection} onValueChange={setRecordSelection} className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="record" id="record" />
                      <Label htmlFor="record">Record</Label>
                      <Input
                        value={recordRange.record}
                        onChange={(e) => setRecordRange({ ...recordRange, record: e.target.value })}
                        className="w-20 ml-2"
                        disabled={recordSelection !== "record"}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fromTo" id="fromTo" />
                      <Label htmlFor="fromTo">From-To</Label>
                      <Input
                        value={recordRange.from}
                        onChange={(e) => setRecordRange({ ...recordRange, from: e.target.value })}
                        className="w-20 ml-2"
                        disabled={recordSelection !== "fromTo"}
                      />
                      <span>-</span>
                      <Input
                        value={recordRange.to}
                        onChange={(e) => setRecordRange({ ...recordRange, to: e.target.value })}
                        className="w-20"
                        disabled={recordSelection !== "fromTo"}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="next" id="next" />
                      <Label htmlFor="next">Next</Label>
                      <Input
                        value={recordRange.next}
                        onChange={(e) => setRecordRange({ ...recordRange, next: e.target.value })}
                        className="w-20 ml-2"
                        disabled={recordSelection !== "next"}
                      />
                      <Label htmlFor="next-start" className="ml-2">
                        Start at:
                      </Label>
                      <Input id="next-start" value="1" className="w-20 ml-2" disabled={recordSelection !== "next"} />
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rest" id="rest" />
                      <Label htmlFor="rest">Rest</Label>
                      <Input
                        value={recordRange.rest}
                        onChange={(e) => setRecordRange({ ...recordRange, rest: e.target.value })}
                        className="w-20 ml-2"
                        disabled={recordSelection !== "rest"}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="marked" id="marked" />
                      <Label htmlFor="marked">Marked</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deleted" id="deleted" />
                      <Label htmlFor="deleted">Deleted</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selection" id="selection" />
                      <Label htmlFor="selection">Selection</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">All</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="options" className="h-full overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <div className="mb-4">
                  <Label className="text-base font-medium">Format Options</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select the formatting option to apply to the selected fields.
                  </p>
                </div>

                <RadioGroup value={formatOption} onValueChange={setFormatOption} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upper" id="upper" />
                    <Label htmlFor="upper">Upper (ALL CAPS)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lower" id="lower" />
                    <Label htmlFor="lower">Lower (all lowercase)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="proper" id="proper" />
                    <Label htmlFor="proper">Proper Case (First Letter Of Each Word)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mixed" id="mixed" />
                    <Label htmlFor="mixed">Mixed Case (First letter of sentence)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clear" id="clear" />
                    <Label htmlFor="clear">Clear (Empty field)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="clearAll" id="clearAll" />
                    <Label htmlFor="clearAll">Clear All (Empty all fields)</Label>
                  </div>
                </RadioGroup>

                <div className="mt-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="include-deleted"
                      checked={includeDeleted}
                      onCheckedChange={(checked) => setIncludeDeleted(checked === true)}
                    />
                    <Label htmlFor="include-deleted">Include Deleted</Label>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="auto-run"
                      checked={autoRun}
                      onCheckedChange={(checked) => setAutoRun(checked === true)}
                    />
                    <Label htmlFor="auto-run">Auto Run</Label>
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
            </TabsContent>

            <TabsContent value="dictionary" className="h-full overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Dictionary</Label>
                    <p className="text-sm text-muted-foreground">Define custom search and replace patterns.</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-dictionary"
                      checked={dictionaryEnabled}
                      onCheckedChange={(checked) => setDictionaryEnabled(checked === true)}
                    />
                    <Label htmlFor="enable-dictionary">Enable</Label>
                  </div>
                </div>

                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Search For</TableHead>
                        <TableHead className="w-[200px]">Replace With</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dictionaryEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={entry.search}
                              onChange={(e) => updateDictionaryEntry(index, "search", e.target.value)}
                              disabled={!dictionaryEnabled}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={entry.replace}
                              onChange={(e) => updateDictionaryEntry(index, "replace", e.target.value)}
                              disabled={!dictionaryEnabled}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDictionaryEntry(index)}
                              disabled={!dictionaryEnabled}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={addDictionaryEntry}
                  disabled={!dictionaryEnabled}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleApplyFormat} disabled={selectedColumns.length === 0}>
            {title.split(" ")[0]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
