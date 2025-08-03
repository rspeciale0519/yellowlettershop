"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronDown, ChevronUp, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ForeclosureCriteria } from "@/types/list-builder"

interface DraggableSliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
  step?: number
  formatValue?: (value: number) => string
  label: string
  className?: string
}

function DraggableSlider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  formatValue = (val) => val.toString(),
  label,
  className,
}: DraggableSliderProps) {
  // Safety check to ensure value is always a valid array
  const safeValue = value && Array.isArray(value) && value.length === 2 ? value : [min, max]

  const [isDragging, setIsDragging] = useState<number | null>(null)

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(index)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging === null) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newValue = min + percentage * (max - min)
    const steppedValue = Math.round(newValue / step) * step

    const newValues = [...safeValue]
    newValues[isDragging] = Math.max(min, Math.min(max, steppedValue))

    // Ensure min <= max
    if (isDragging === 0 && newValues[0] > newValues[1]) {
      newValues[1] = newValues[0]
    } else if (isDragging === 1 && newValues[1] < newValues[0]) {
      newValues[0] = newValues[1]
    }

    onValueChange(newValues)
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatValue(safeValue[0])} - {formatValue(safeValue[1])}
        </div>
      </div>
      <div
        className="relative h-6 cursor-pointer select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Active range */}
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 bg-yellow-500 rounded-full"
          style={{
            left: `${getPercentage(safeValue[0])}%`,
            width: `${getPercentage(safeValue[1]) - getPercentage(safeValue[0])}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className={cn(
            "absolute top-1/2 w-5 h-5 -translate-y-1/2 -translate-x-1/2 bg-white border-2 border-yellow-500 rounded-full cursor-grab shadow-sm transition-transform hover:scale-110",
            isDragging === 0 && "scale-110 cursor-grabbing",
          )}
          style={{ left: `${getPercentage(safeValue[0])}%` }}
          onMouseDown={handleMouseDown(0)}
        />

        {/* Max thumb */}
        <div
          className={cn(
            "absolute top-1/2 w-5 h-5 -translate-y-1/2 -translate-x-1/2 bg-white border-2 border-yellow-500 rounded-full cursor-grab shadow-sm transition-transform hover:scale-110",
            isDragging === 1 && "scale-110 cursor-grabbing",
          )}
          style={{ left: `${getPercentage(safeValue[1])}%` }}
          onMouseDown={handleMouseDown(1)}
        />
      </div>
    </div>
  )
}

interface ForeclosureFiltersProps {
  criteria: ForeclosureCriteria
  onUpdate: (values: Partial<ForeclosureCriteria>) => void
}

export function ForeclosureFilters({ criteria, onUpdate }: ForeclosureFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["status"])
  const [newLender, setNewLender] = useState("")
  const [newOwner, setNewOwner] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newTrustee, setNewTrustee] = useState("")
  const [newCaseNumber, setNewCaseNumber] = useState("")

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleCriteriaToggle = (criterion: string) => {
    const currentCriteria = criteria.selectedCriteria || []
    const updatedCriteria = currentCriteria.includes(criterion)
      ? currentCriteria.filter((c) => c !== criterion)
      : [...currentCriteria, criterion]

    onUpdate({ selectedCriteria: updatedCriteria })
  }

  const handleStatusToggle = (status: string) => {
    const currentStatuses = Array.isArray(criteria.foreclosureStatus) ? criteria.foreclosureStatus : []
    const updatedStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]

    onUpdate({ foreclosureStatus: updatedStatuses })
  }

  const handleDateRangeUpdate = (field: string, type: "from" | "to", date: Date | undefined) => {
    const currentRange = criteria[field as keyof ForeclosureCriteria] as any
    const updatedRange = {
      ...currentRange,
      [type]: date ? format(date, "yyyy-MM-dd") : "",
    }
    onUpdate({ [field]: updatedRange })
  }

  const handleAmountRangeUpdate = (field: string, values: number[]) => {
    onUpdate({ [field]: { min: values[0], max: values[1] } })
  }

  const addItem = (field: string, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      const currentItems = Array.isArray(criteria[field as keyof ForeclosureCriteria])
        ? (criteria[field as keyof ForeclosureCriteria] as string[])
        : []
      onUpdate({ [field]: [...currentItems, value.trim()] })
      setter("")
    }
  }

  const removeItem = (field: string, index: number) => {
    const currentItems = Array.isArray(criteria[field as keyof ForeclosureCriteria])
      ? (criteria[field as keyof ForeclosureCriteria] as string[])
      : []
    onUpdate({ [field]: currentItems.filter((_, i) => i !== index) })
  }

  const foreclosureStatuses = [
    "pre-foreclosure",
    "notice-of-default",
    "lis-pendens",
    "auction-scheduled",
    "reo",
    "completed-foreclosure",
    "cancelled-foreclosure",
  ]

  const noticeTypes = [
    "Notice of Default",
    "Lis Pendens",
    "Notice of Trustee Sale",
    "Notice of Foreclosure Sale",
    "Substitution of Trustee",
    "Assignment of Deed of Trust",
  ]

  const sections = [
    { id: "status", title: "Foreclosure Status", count: (criteria.foreclosureStatus || []).length },
    { id: "dates", title: "Important Dates", count: 0 },
    { id: "amounts", title: "Financial Details", count: 0 },
    {
      id: "parties",
      title: "Parties Involved",
      count:
        (criteria.lenderNames || []).length +
        (criteria.currentOwners || []).length +
        (criteria.trusteeNames || []).length,
    },
    { id: "properties", title: "Property Details", count: (criteria.propertyAddresses || []).length },
    {
      id: "legal",
      title: "Legal Information",
      count: (criteria.noticeTypes || []).length + (criteria.caseNumbers || []).length,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Foreclosure Filters</h2>
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {(criteria.selectedCriteria || []).length} criteria selected
        </Badge>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {section.title}
                  {section.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      {section.count}
                    </Badge>
                  )}
                </CardTitle>
                {expandedSections.includes(section.id) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </CardHeader>

            {expandedSections.includes(section.id) && (
              <CardContent className="pt-0">
                {section.id === "status" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="foreclosure-status"
                        checked={(criteria.selectedCriteria || []).includes("foreclosure-status")}
                        onCheckedChange={() => handleCriteriaToggle("foreclosure-status")}
                      />
                      <Label htmlFor="foreclosure-status" className="font-medium">
                        Filter by Foreclosure Status
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("foreclosure-status") && (
                      <div className="ml-6 space-y-3">
                        <Label className="text-sm font-medium">Select Foreclosure Statuses:</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {foreclosureStatuses.map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`status-${status}`}
                                checked={(criteria.foreclosureStatus || []).includes(status)}
                                onCheckedChange={() => handleStatusToggle(status)}
                              />
                              <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                                {status.replace(/-/g, " ")}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {section.id === "dates" && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="foreclosure-date"
                        checked={(criteria.selectedCriteria || []).includes("foreclosure-date")}
                        onCheckedChange={() => handleCriteriaToggle("foreclosure-date")}
                      />
                      <Label htmlFor="foreclosure-date" className="font-medium">
                        Filter by Foreclosure Date
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("foreclosure-date") && (
                      <div className="ml-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">From Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !criteria.foreclosureDate?.from && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {criteria.foreclosureDate?.from ? (
                                    format(new Date(criteria.foreclosureDate.from), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={
                                    criteria.foreclosureDate?.from ? new Date(criteria.foreclosureDate.from) : undefined
                                  }
                                  onSelect={(date) => handleDateRangeUpdate("foreclosureDate", "from", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">To Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !criteria.foreclosureDate?.to && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {criteria.foreclosureDate?.to ? (
                                    format(new Date(criteria.foreclosureDate.to), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={
                                    criteria.foreclosureDate?.to ? new Date(criteria.foreclosureDate.to) : undefined
                                  }
                                  onSelect={(date) => handleDateRangeUpdate("foreclosureDate", "to", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auction-date"
                        checked={(criteria.selectedCriteria || []).includes("auction-date")}
                        onCheckedChange={() => handleCriteriaToggle("auction-date")}
                      />
                      <Label htmlFor="auction-date" className="font-medium">
                        Filter by Auction Date
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("auction-date") && (
                      <div className="ml-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">From Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !criteria.auctionDate?.from && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {criteria.auctionDate?.from ? (
                                    format(new Date(criteria.auctionDate.from), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={
                                    criteria.auctionDate?.from ? new Date(criteria.auctionDate.from) : undefined
                                  }
                                  onSelect={(date) => handleDateRangeUpdate("auctionDate", "from", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">To Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !criteria.auctionDate?.to && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {criteria.auctionDate?.to ? (
                                    format(new Date(criteria.auctionDate.to), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={criteria.auctionDate?.to ? new Date(criteria.auctionDate.to) : undefined}
                                  onSelect={(date) => handleDateRangeUpdate("auctionDate", "to", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {section.id === "amounts" && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="foreclosure-amount"
                        checked={(criteria.selectedCriteria || []).includes("foreclosure-amount")}
                        onCheckedChange={() => handleCriteriaToggle("foreclosure-amount")}
                      />
                      <Label htmlFor="foreclosure-amount" className="font-medium">
                        Filter by Foreclosure Amount
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("foreclosure-amount") && (
                      <div className="ml-6">
                        <DraggableSlider
                          value={
                            criteria.foreclosureAmount
                              ? [criteria.foreclosureAmount.min, criteria.foreclosureAmount.max]
                              : [0, 1000000]
                          }
                          onValueChange={(values) => handleAmountRangeUpdate("foreclosureAmount", values)}
                          min={0}
                          max={1000000}
                          step={1000}
                          formatValue={(value) => `$${value.toLocaleString()}`}
                          label="Foreclosure Amount Range"
                        />
                      </div>
                    )}
                  </div>
                )}

                {section.id === "parties" && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lender-names"
                        checked={(criteria.selectedCriteria || []).includes("lender-names")}
                        onCheckedChange={() => handleCriteriaToggle("lender-names")}
                      />
                      <Label htmlFor="lender-names" className="font-medium">
                        Filter by Lender Names
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("lender-names") && (
                      <div className="ml-6 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter lender name"
                            value={newLender}
                            onChange={(e) => setNewLender(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && addItem("lenderNames", newLender, setNewLender)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addItem("lenderNames", newLender, setNewLender)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(criteria.lenderNames || []).map((lender, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {lender}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem("lenderNames", index)} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="current-owners"
                        checked={(criteria.selectedCriteria || []).includes("current-owners")}
                        onCheckedChange={() => handleCriteriaToggle("current-owners")}
                      />
                      <Label htmlFor="current-owners" className="font-medium">
                        Filter by Current Owners
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("current-owners") && (
                      <div className="ml-6 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter owner name"
                            value={newOwner}
                            onChange={(e) => setNewOwner(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && addItem("currentOwners", newOwner, setNewOwner)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addItem("currentOwners", newOwner, setNewOwner)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(criteria.currentOwners || []).map((owner, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {owner}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeItem("currentOwners", index)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="trustee-names"
                        checked={(criteria.selectedCriteria || []).includes("trustee-names")}
                        onCheckedChange={() => handleCriteriaToggle("trustee-names")}
                      />
                      <Label htmlFor="trustee-names" className="font-medium">
                        Filter by Trustee Names
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("trustee-names") && (
                      <div className="ml-6 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter trustee name"
                            value={newTrustee}
                            onChange={(e) => setNewTrustee(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && addItem("trusteeNames", newTrustee, setNewTrustee)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addItem("trusteeNames", newTrustee, setNewTrustee)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(criteria.trusteeNames || []).map((trustee, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {trustee}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem("trusteeNames", index)} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {section.id === "properties" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="property-addresses"
                        checked={(criteria.selectedCriteria || []).includes("property-addresses")}
                        onCheckedChange={() => handleCriteriaToggle("property-addresses")}
                      />
                      <Label htmlFor="property-addresses" className="font-medium">
                        Filter by Property Addresses
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("property-addresses") && (
                      <div className="ml-6 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter property address"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && addItem("propertyAddresses", newAddress, setNewAddress)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addItem("propertyAddresses", newAddress, setNewAddress)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(criteria.propertyAddresses || []).map((address, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {address}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeItem("propertyAddresses", index)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {section.id === "legal" && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notice-types"
                        checked={(criteria.selectedCriteria || []).includes("notice-types")}
                        onCheckedChange={() => handleCriteriaToggle("notice-types")}
                      />
                      <Label htmlFor="notice-types" className="font-medium">
                        Filter by Notice Types
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("notice-types") && (
                      <div className="ml-6 space-y-3">
                        <Label className="text-sm font-medium">Select Notice Types:</Label>
                        <div className="grid grid-cols-1 gap-3">
                          {noticeTypes.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`notice-${type}`}
                                checked={(criteria.noticeTypes || []).includes(type)}
                                onCheckedChange={() => {
                                  const currentTypes = Array.isArray(criteria.noticeTypes) ? criteria.noticeTypes : []
                                  const updatedTypes = currentTypes.includes(type)
                                    ? currentTypes.filter((t) => t !== type)
                                    : [...currentTypes, type]
                                  onUpdate({ noticeTypes: updatedTypes })
                                }}
                              />
                              <Label htmlFor={`notice-${type}`} className="text-sm">
                                {type}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="case-numbers"
                        checked={(criteria.selectedCriteria || []).includes("case-numbers")}
                        onCheckedChange={() => handleCriteriaToggle("case-numbers")}
                      />
                      <Label htmlFor="case-numbers" className="font-medium">
                        Filter by Case Numbers
                      </Label>
                    </div>

                    {(criteria.selectedCriteria || []).includes("case-numbers") && (
                      <div className="ml-6 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter case number"
                            value={newCaseNumber}
                            onChange={(e) => setNewCaseNumber(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && addItem("caseNumbers", newCaseNumber, setNewCaseNumber)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addItem("caseNumbers", newCaseNumber, setNewCaseNumber)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(criteria.caseNumbers || []).map((caseNum, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {caseNum}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem("caseNumbers", index)} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
