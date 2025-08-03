"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Plus, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

// Define the types for our filter criteria
export type ColumnFilterOperator =
  | "contains"
  | "equals"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "between"
  | "empty"
  | "notEmpty"

export type TagFilterOperator = "hasAll" | "hasAny" | "hasNone" | "hasOnly"

export type MailingHistoryOperator = "mailedInLast" | "mailedMoreThan" | "notMailed" | "mailedBetween"

export type RecordCountOperator = "topRecords" | "randomRecords" | "recordRange"

export type ColumnFilter = {
  id: string
  column: string
  operator: ColumnFilterOperator
  value: string | number | Date | [Date, Date] | null
}

export type TagFilter = {
  id: string
  operator: TagFilterOperator
  tagIds: string[]
}

export type MailingHistoryFilter = {
  id: string
  operator: MailingHistoryOperator
  value: number | [Date, Date]
}

export type RecordCountFilter = {
  id: string
  operator: RecordCountOperator
  value: number | [number, number]
}

export type ListFilter = {
  id: string
  listIds: string[]
}

export type AdvancedSearchCriteria = {
  columnFilters: ColumnFilter[]
  tagFilter: TagFilter | null
  mailingHistoryFilter: MailingHistoryFilter | null
  recordCountFilter: RecordCountFilter | null
  listFilter: ListFilter | null
  logicalOperator: "AND" | "OR"
}

interface AdvancedSearchProps {
  isOpen: boolean
  lists: any[]
  tags: { id: string; name: string }[]
  columns: { id: string; name: string; type: "text" | "number" | "date" | "select" | "boolean" }[]
  initialCriteria?: AdvancedSearchCriteria
  onCriteriaChange: (criteria: AdvancedSearchCriteria) => void
}

export function AdvancedSearch({
  isOpen,
  lists,
  tags,
  columns,
  initialCriteria,
  onCriteriaChange,
}: AdvancedSearchProps) {
  // Initialize with default criteria or provided initial criteria
  const [criteria, setCriteria] = useState<AdvancedSearchCriteria>(
    initialCriteria || {
      columnFilters: [],
      tagFilter: null,
      mailingHistoryFilter: null,
      recordCountFilter: null,
      listFilter: null,
      logicalOperator: "AND",
    },
  )

  // State for date picker
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Reset criteria when initialCriteria changes
  useEffect(() => {
    if (initialCriteria) {
      setCriteria(initialCriteria)
    }
  }, [initialCriteria])

  // Notify parent component when criteria changes
  useEffect(() => {
    onCriteriaChange(criteria)
  }, [criteria, onCriteriaChange])

  // Update criteria with new values and notify parent
  const updateCriteria = (updates: Partial<AdvancedSearchCriteria>) => {
    setCriteria((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  // Add a new column filter
  const addColumnFilter = () => {
    const newFilter: ColumnFilter = {
      id: `col-${Date.now()}`,
      column: columns[0].id,
      operator: "contains",
      value: "",
    }
    updateCriteria({
      columnFilters: [...criteria.columnFilters, newFilter],
    })
  }

  // Remove a column filter
  const removeColumnFilter = (id: string) => {
    updateCriteria({
      columnFilters: criteria.columnFilters.filter((filter) => filter.id !== id),
    })
  }

  // Update a column filter
  const updateColumnFilter = (id: string, updates: Partial<ColumnFilter>) => {
    updateCriteria({
      columnFilters: criteria.columnFilters.map((filter) => (filter.id === id ? { ...filter, ...updates } : filter)),
    })
  }

  // Set tag filter
  const setTagFilter = (tagFilter: TagFilter | null) => {
    updateCriteria({
      tagFilter,
    })
  }

  // Set mailing history filter
  const setMailingHistoryFilter = (mailingHistoryFilter: MailingHistoryFilter | null) => {
    updateCriteria({
      mailingHistoryFilter,
    })
  }

  // Set record count filter
  const setRecordCountFilter = (recordCountFilter: RecordCountFilter | null) => {
    updateCriteria({
      recordCountFilter,
    })
  }

  // Set list filter
  const setListFilter = (listFilter: ListFilter | null) => {
    updateCriteria({
      listFilter,
    })
  }

  // Get appropriate operators for a column type
  const getOperatorsForColumnType = (columnType: string) => {
    switch (columnType) {
      case "text":
        return [
          { value: "contains", label: "Contains" },
          { value: "equals", label: "Equals" },
          { value: "startsWith", label: "Starts with" },
          { value: "endsWith", label: "Ends with" },
          { value: "empty", label: "Is empty" },
          { value: "notEmpty", label: "Is not empty" },
        ]
      case "number":
        return [
          { value: "equals", label: "Equals" },
          { value: "greaterThan", label: "Greater than" },
          { value: "lessThan", label: "Less than" },
          { value: "between", label: "Between" },
          { value: "empty", label: "Is empty" },
          { value: "notEmpty", label: "Is not empty" },
        ]
      case "date":
        return [
          { value: "equals", label: "Equals" },
          { value: "greaterThan", label: "After" },
          { value: "lessThan", label: "Before" },
          { value: "between", label: "Between" },
          { value: "empty", label: "Is empty" },
          { value: "notEmpty", label: "Is not empty" },
        ]
      case "boolean":
        return [{ value: "equals", label: "Equals" }]
      default:
        return [
          { value: "contains", label: "Contains" },
          { value: "equals", label: "Equals" },
        ]
    }
  }

  // Render the value input based on column type and operator
  const renderValueInput = (filter: ColumnFilter, columnType: string) => {
    const needsValueInput = !["empty", "notEmpty"].includes(filter.operator)

    if (!needsValueInput) {
      return null
    }

    switch (columnType) {
      case "text":
        return (
          <Input
            value={(filter.value as string) || ""}
            onChange={(e) => updateColumnFilter(filter.id, { value: e.target.value })}
            placeholder="Enter value"
            className="w-full"
          />
        )
      case "number":
        if (filter.operator === "between") {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={(filter.value as [number, number])?.[0] || ""}
                onChange={(e) => {
                  const currentValue = (filter.value as [number, number]) || [0, 0]
                  updateColumnFilter(filter.id, {
                    value: [Number(e.target.value), currentValue[1]],
                  })
                }}
                placeholder="Min"
                className="w-full"
              />
              <span>to</span>
              <Input
                type="number"
                value={(filter.value as [number, number])?.[1] || ""}
                onChange={(e) => {
                  const currentValue = (filter.value as [number, number]) || [0, 0]
                  updateColumnFilter(filter.id, {
                    value: [currentValue[0], Number(e.target.value)],
                  })
                }}
                placeholder="Max"
                className="w-full"
              />
            </div>
          )
        }
        return (
          <Input
            type="number"
            value={(filter.value as number) || ""}
            onChange={(e) => updateColumnFilter(filter.id, { value: Number(e.target.value) })}
            placeholder="Enter value"
            className="w-full"
          />
        )
      case "date":
        if (filter.operator === "between") {
          return (
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      setDateRange(range || { from: undefined, to: undefined })
                      if (range?.from && range?.to) {
                        updateColumnFilter(filter.id, {
                          value: [range.from, range.to],
                        })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )
        }
        return (
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !filter.value && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.value ? format(filter.value as Date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={(filter.value as Date) || undefined}
                  onSelect={(date) => updateColumnFilter(filter.id, { value: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )
      case "boolean":
        return (
          <Select value={filter.value as string} onValueChange={(value) => updateColumnFilter(filter.id, { value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            value={(filter.value as string) || ""}
            onChange={(e) => updateColumnFilter(filter.id, { value: e.target.value })}
            placeholder="Enter value"
            className="w-full"
          />
        )
    }
  }

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 mt-0"}`}
    >
      <div className="bg-card rounded-md p-3 pt-2">
        {/* Main instructions section */}
        <div className="mb-4 text-sm">
          <h3 className="text-base font-bold mb-1">Advanced Search</h3>
          <p className="mb-2">Use the options below to create precise filters for your mailing lists and records.</p>
          <p className="text-muted-foreground mb-1">Filters are applied automatically as you make changes.</p>
        </div>

        {/* Column Filters - Full width row */}
        <div className="mb-4">
          <div className="bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
            <h3 className="text-base font-semibold mb-2">Column Filters</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Search specific fields by selecting a column, operator, and value.
            </p>
            <div className="space-y-4">
              {criteria.columnFilters.map((filter) => {
                const column = columns.find((col) => col.id === filter.column)
                const columnType = column?.type || "text"

                return (
                  <div key={filter.id} className="flex items-start gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                      <Select
                        value={filter.column}
                        onValueChange={(value) => updateColumnFilter(filter.id, { column: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              {column.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filter.operator}
                        onValueChange={(value) =>
                          updateColumnFilter(filter.id, {
                            operator: value as ColumnFilterOperator,
                            value: ["empty", "notEmpty"].includes(value) ? null : "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForColumnType(columnType).map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex-1">{renderValueInput(filter, columnType)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeColumnFilter(filter.id)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
              <Button variant="outline" size="sm" onClick={addColumnFilter} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Column Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Mailing List Selection and Tag Filters - 50% width each */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Mailing List Selection */}
          <div className="flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
            <h3 className="text-base font-semibold mb-2">Mailing List Selection</h3>
            <p className="text-sm text-muted-foreground mb-3">Choose which mailing lists to include in your search.</p>
            <div className="space-y-4">
              <div className="border rounded-md w-full">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search lists..." />
                  <CommandList className="h-[200px] max-h-[200px] overflow-auto">
                    <CommandEmpty>No list found.</CommandEmpty>
                    <CommandGroup>
                      {lists.map((list) => (
                        <CommandItem
                          key={list.id}
                          onSelect={() => {
                            // Toggle selection
                            if (criteria.listFilter?.listIds.includes(list.id)) {
                              // Remove from selection
                              if (!criteria.listFilter) return
                              const newListIds = criteria.listFilter.listIds.filter((id) => id !== list.id)
                              if (newListIds.length === 0) {
                                setListFilter(null)
                              } else {
                                setListFilter({
                                  ...criteria.listFilter,
                                  listIds: newListIds,
                                })
                              }
                            } else {
                              // Add to selection
                              const currentListIds = criteria.listFilter?.listIds || []
                              setListFilter({
                                id: criteria.listFilter?.id || `list-${Date.now()}`,
                                listIds: [...currentListIds, list.id],
                              })
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              checked={criteria.listFilter?.listIds.includes(list.id)}
                              className="pointer-events-none"
                            />
                            <span className="truncate">
                              {list.name} ({list.recordCount})
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
              {criteria.listFilter && (
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="mr-2">
                    {criteria.listFilter.listIds.length} lists selected
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setListFilter(null)}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tag Filters */}
          <div className="flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
            <h3 className="text-base font-semibold mb-2">Tag Filters</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Filter by tags to match records with specific tag combinations.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Label className="whitespace-nowrap">Filter Type</Label>
                <Select
                  value={criteria.tagFilter?.operator || "hasAny"}
                  onValueChange={(value) => {
                    if (!criteria.tagFilter) {
                      setTagFilter({
                        id: `tag-${Date.now()}`,
                        operator: value as TagFilterOperator,
                        tagIds: [],
                      })
                    } else {
                      setTagFilter({
                        ...criteria.tagFilter,
                        operator: value as TagFilterOperator,
                      })
                    }
                  }}
                >
                  <SelectTrigger className="w-auto min-w-[180px]">
                    <SelectValue placeholder="Select filter type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hasAll">Has all selected tags</SelectItem>
                    <SelectItem value="hasAny">Has any selected tags</SelectItem>
                    <SelectItem value="hasNone">Has none of the selected tags</SelectItem>
                    <SelectItem value="hasOnly">Has only the selected tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md w-full">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search tags..." />
                  <CommandList className="h-[200px] max-h-[200px] overflow-auto">
                    <CommandEmpty>No tag found.</CommandEmpty>
                    <CommandGroup>
                      {tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => {
                            // Toggle selection
                            if (criteria.tagFilter?.tagIds.includes(tag.id)) {
                              // Remove from selection
                              if (!criteria.tagFilter) return
                              const newTagIds = criteria.tagFilter.tagIds.filter((id) => id !== tag.id)
                              if (newTagIds.length === 0) {
                                setTagFilter(null)
                              } else {
                                setTagFilter({
                                  ...criteria.tagFilter,
                                  tagIds: newTagIds,
                                })
                              }
                            } else {
                              // Add to selection
                              const currentTagIds = criteria.tagFilter?.tagIds || []
                              setTagFilter({
                                id: criteria.tagFilter?.id || `tag-${Date.now()}`,
                                operator: criteria.tagFilter?.operator || "hasAny",
                                tagIds: [...currentTagIds, tag.id],
                              })
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Checkbox
                              checked={criteria.tagFilter?.tagIds.includes(tag.id)}
                              className="pointer-events-none"
                            />
                            <span className="truncate">{tag.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>

              {criteria.tagFilter && criteria.tagFilter.tagIds.length > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1 max-w-[70%]">
                    {criteria.tagFilter.tagIds.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId)
                      return tag ? (
                        <Badge key={tag.id} variant="outline" className="mb-1">
                          {tag.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTagFilter(null)}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mailing History and Record Count Filters - 50% width each */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Mailing History */}
          <div className="flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
            <h3 className="text-base font-semibold mb-2">Mailing History</h3>
            <p className="text-sm text-muted-foreground mb-3">Find records based on when they were last mailed.</p>
            <div className="space-y-4">
              <RadioGroup
                value={criteria.mailingHistoryFilter?.operator || ""}
                onValueChange={(value) => {
                  if (!value) {
                    setMailingHistoryFilter(null)
                    return
                  }

                  let defaultValue: number | [Date, Date] = 30
                  if (value === "mailedBetween") {
                    const today = new Date()
                    const thirtyDaysAgo = new Date()
                    thirtyDaysAgo.setDate(today.getDate() - 30)
                    defaultValue = [thirtyDaysAgo, today]
                  }

                  setMailingHistoryFilter({
                    id: `mailing-${Date.now()}`,
                    operator: value as MailingHistoryOperator,
                    value: defaultValue,
                  })
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="mailing-none" />
                  <Label htmlFor="mailing-none">No mailing history filter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mailedInLast" id="mailing-in-last" />
                  <Label htmlFor="mailing-in-last">Mailed in the last</Label>
                  {criteria.mailingHistoryFilter?.operator === "mailedInLast" && (
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={criteria.mailingHistoryFilter.value as number}
                        onChange={(e) => {
                          if (!criteria.mailingHistoryFilter) return
                          setMailingHistoryFilter({
                            ...criteria.mailingHistoryFilter,
                            value: Number(e.target.value),
                          })
                        }}
                      />
                      <span>days</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mailedMoreThan" id="mailing-more-than" />
                  <Label htmlFor="mailing-more-than">Mailed more than</Label>
                  {criteria.mailingHistoryFilter?.operator === "mailedMoreThan" && (
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={criteria.mailingHistoryFilter.value as number}
                        onChange={(e) => {
                          if (!criteria.mailingHistoryFilter) return
                          setMailingHistoryFilter({
                            ...criteria.mailingHistoryFilter,
                            value: Number(e.target.value),
                          })
                        }}
                      />
                      <span>days ago</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="notMailed" id="not-mailed" />
                  <Label htmlFor="not-mailed">Not yet mailed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mailedBetween" id="mailed-between" />
                  <Label htmlFor="mailed-between">Mailed between specific dates</Label>
                </div>
              </RadioGroup>

              {criteria.mailingHistoryFilter?.operator === "mailedBetween" && (
                <div className="mt-4">
                  <Label className="mb-2 block">Select date range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !criteria.mailingHistoryFilter.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {Array.isArray(criteria.mailingHistoryFilter.value) ? (
                          <>
                            {format(criteria.mailingHistoryFilter.value[0], "LLL dd, y")} -{" "}
                            {format(criteria.mailingHistoryFilter.value[1], "LLL dd, y")}
                          </>
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: Array.isArray(criteria.mailingHistoryFilter.value)
                            ? criteria.mailingHistoryFilter.value[0]
                            : undefined,
                          to: Array.isArray(criteria.mailingHistoryFilter.value)
                            ? criteria.mailingHistoryFilter.value[1]
                            : undefined,
                        }}
                        onSelect={(range) => {
                          if (!criteria.mailingHistoryFilter) return
                          if (range?.from && range?.to) {
                            setMailingHistoryFilter({
                              ...criteria.mailingHistoryFilter,
                              value: [range.from, range.to],
                            })
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* Record Count Filters */}
          <div className="flex-1 bg-background p-4 rounded-lg hover:bg-accent/10 transition-colors">
            <h3 className="text-base font-semibold mb-2">Record Count Filters</h3>
            <p className="text-sm text-muted-foreground mb-3">Limit results to a specific number of records.</p>
            <div className="space-y-4">
              <RadioGroup
                value={criteria.recordCountFilter?.operator || ""}
                onValueChange={(value) => {
                  if (!value) {
                    setRecordCountFilter(null)
                    return
                  }

                  let defaultValue: number | [number, number] = 100
                  if (value === "recordRange") {
                    defaultValue = [1, 100]
                  }

                  setRecordCountFilter({
                    id: `count-${Date.now()}`,
                    operator: value as RecordCountOperator,
                    value: defaultValue,
                  })
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="count-none" />
                  <Label htmlFor="count-none">No record count filter</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="topRecords" id="top-records" />
                  <Label htmlFor="top-records">Top records</Label>
                  {criteria.recordCountFilter?.operator === "topRecords" && (
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={criteria.recordCountFilter.value as number}
                        onChange={(e) => {
                          if (!criteria.recordCountFilter) return
                          setRecordCountFilter({
                            ...criteria.recordCountFilter,
                            value: Number(e.target.value),
                          })
                        }}
                      />
                      <span>records</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="randomRecords" id="random-records" />
                  <Label htmlFor="random-records">Random selection</Label>
                  {criteria.recordCountFilter?.operator === "randomRecords" && (
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={criteria.recordCountFilter.value as number}
                        onChange={(e) => {
                          if (!criteria.recordCountFilter) return
                          setRecordCountFilter({
                            ...criteria.recordCountFilter,
                            value: Number(e.target.value),
                          })
                        }}
                      />
                      <span>records</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recordRange" id="record-range" />
                  <Label htmlFor="record-range">Record range</Label>
                </div>
              </RadioGroup>

              {criteria.recordCountFilter?.operator === "recordRange" && (
                <div className="mt-4">
                  <Label className="mb-2 block">Select record range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      className="w-20"
                      value={Array.isArray(criteria.recordCountFilter.value) ? criteria.recordCountFilter.value[0] : 1}
                      onChange={(e) => {
                        if (!criteria.recordCountFilter) return
                        const currentValue = Array.isArray(criteria.recordCountFilter.value)
                          ? criteria.recordCountFilter.value
                          : [1, 100]
                        setRecordCountFilter({
                          ...criteria.recordCountFilter,
                          value: [Number(e.target.value), currentValue[1]],
                        })
                      }}
                      placeholder="From"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      min="1"
                      className="w-20"
                      value={
                        Array.isArray(criteria.recordCountFilter.value) ? criteria.recordCountFilter.value[1] : 100
                      }
                      onChange={(e) => {
                        if (!criteria.recordCountFilter) return
                        const currentValue = Array.isArray(criteria.recordCountFilter.value)
                          ? criteria.recordCountFilter.value
                          : [1, 100]
                        setRecordCountFilter({
                          ...criteria.recordCountFilter,
                          value: [currentValue[0], Number(e.target.value)],
                        })
                      }}
                      placeholder="To"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        <div className="mt-4 bg-muted/30 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {criteria.columnFilters.length > 0 && (
              <Badge variant="secondary">{criteria.columnFilters.length} column filter(s)</Badge>
            )}
            {criteria.listFilter && (
              <Badge variant="secondary">{criteria.listFilter.listIds.length} list(s) selected</Badge>
            )}
            {criteria.tagFilter && (
              <Badge variant="secondary">
                {criteria.tagFilter.operator} {criteria.tagFilter.tagIds.length} tag(s)
              </Badge>
            )}
            {criteria.mailingHistoryFilter && (
              <Badge variant="secondary">Mailing history: {criteria.mailingHistoryFilter.operator}</Badge>
            )}
            {criteria.recordCountFilter && (
              <Badge variant="secondary">Record count: {criteria.recordCountFilter.operator}</Badge>
            )}
            {!criteria.columnFilters.length &&
              !criteria.listFilter &&
              !criteria.tagFilter &&
              !criteria.mailingHistoryFilter &&
              !criteria.recordCountFilter && <span className="text-muted-foreground text-sm">No active filters</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
