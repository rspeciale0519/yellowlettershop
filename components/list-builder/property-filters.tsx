"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  HelpCircle,
  Save,
  RotateCcw,
  Building,
  Factory,
  TreePine,
} from "lucide-react"
import type { PropertyCriteria } from "@/types/list-builder"

// Property type categories with icons and descriptions
const PROPERTY_TYPES = [
  {
    category: "Residential",
    icon: Home,
    color: "text-blue-500",
    types: [
      { value: "single-family", label: "Single Family Residence", description: "Detached single-family homes" },
      {
        value: "multi-family",
        label: "Multi-Family",
        description: "Duplexes, triplexes, and small apartment buildings",
      },
      { value: "condominium", label: "Condominium", description: "Individual units in condo complexes" },
      { value: "townhouse", label: "Townhouse", description: "Attached single-family units" },
      { value: "mobile-home", label: "Mobile Home", description: "Manufactured and mobile homes" },
      { value: "cooperative", label: "Cooperative", description: "Co-op housing units" },
    ],
  },
  {
    category: "Commercial",
    icon: Building,
    color: "text-green-500",
    types: [
      { value: "office", label: "Office Building", description: "Commercial office spaces" },
      { value: "retail", label: "Retail", description: "Stores, shopping centers, and retail spaces" },
      { value: "restaurant", label: "Restaurant", description: "Food service establishments" },
      { value: "hotel-motel", label: "Hotel/Motel", description: "Hospitality properties" },
      { value: "mixed-use", label: "Mixed Use", description: "Combined residential and commercial" },
      { value: "medical", label: "Medical", description: "Healthcare facilities and medical offices" },
    ],
  },
  {
    category: "Industrial",
    icon: Factory,
    color: "text-orange-500",
    types: [
      { value: "warehouse", label: "Warehouse", description: "Storage and distribution facilities" },
      { value: "manufacturing", label: "Manufacturing", description: "Industrial production facilities" },
      { value: "flex-space", label: "Flex Space", description: "Multi-purpose industrial spaces" },
      { value: "research-development", label: "Research & Development", description: "R&D facilities" },
    ],
  },
  {
    category: "Land & Other",
    icon: TreePine,
    color: "text-green-600",
    types: [
      { value: "vacant-land", label: "Vacant Land", description: "Undeveloped land parcels" },
      { value: "agricultural", label: "Agricultural", description: "Farms and agricultural properties" },
      { value: "recreational", label: "Recreational", description: "Parks, golf courses, and recreational facilities" },
      { value: "institutional", label: "Institutional", description: "Schools, churches, and government buildings" },
      { value: "special-purpose", label: "Special Purpose", description: "Unique or specialized properties" },
    ],
  },
]

// Predefined criteria templates for quick selection
const CRITERIA_TEMPLATES = [
  {
    id: "luxury-homes",
    name: "Luxury Homes",
    description: "High-value single-family homes",
    criteria: {
      propertyTypes: ["single-family"],
      propertyValue: [750000, 5000000],
      squareFootage: [3000, 15000],
      yearBuilt: [1990, new Date().getFullYear()],
      bedrooms: [4, 8],
      bathrooms: [3, 8],
    },
  },
  {
    id: "starter-homes",
    name: "Starter Homes",
    description: "Affordable entry-level properties",
    criteria: {
      propertyTypes: ["single-family", "condominium", "townhouse"],
      propertyValue: [150000, 400000],
      squareFootage: [800, 2000],
      bedrooms: [2, 3],
      bathrooms: [1, 2],
    },
  },
  {
    id: "investment-properties",
    name: "Investment Properties",
    description: "Multi-family and rental properties",
    criteria: {
      propertyTypes: ["multi-family", "condominium"],
      propertyValue: [200000, 1000000],
      squareFootage: [1200, 5000],
      bedrooms: [2, 6],
    },
  },
  {
    id: "commercial-retail",
    name: "Commercial Retail",
    description: "Retail and commercial spaces",
    criteria: {
      propertyTypes: ["retail", "office", "mixed-use"],
      propertyValue: [300000, 2000000],
      squareFootage: [1500, 10000],
    },
  },
]

// Draggable Slider Component (same as Demographics)
interface DraggableSliderProps {
  label: string
  value: number[]
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  onChange: (value: number[]) => void
  ariaLabel: string
}

function DraggableSlider({ label, value, min, max, step, formatValue, onChange, ariaLabel }: DraggableSliderProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null)
  const [dragStartValue, setDragStartValue] = useState<number[]>(value)
  const sliderRef = useRef<HTMLDivElement>(null)
  const minHandleRef = useRef<HTMLDivElement>(null)
  const maxHandleRef = useRef<HTMLDivElement>(null)

  const getSliderBounds = useCallback(() => {
    if (!sliderRef.current) return { left: 0, width: 0 }
    const rect = sliderRef.current.getBoundingClientRect()
    return { left: rect.left, width: rect.width }
  }, [])

  const valueToPosition = useCallback(
    (val: number) => {
      return ((val - min) / (max - min)) * 100
    },
    [min, max],
  )

  const positionToValue = useCallback(
    (position: number, bounds: { left: number; width: number }) => {
      const percentage = Math.max(0, Math.min(100, (position / bounds.width) * 100))
      const rawValue = min + (percentage / 100) * (max - min)
      return Math.round(rawValue / step) * step
    },
    [min, max, step],
  )

  const handleMouseDown = useCallback(
    (handle: "min" | "max") => (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(handle)
      setDragStartValue(value)
      document.body.style.userSelect = "none"
    },
    [value],
  )

  const handleTouchStart = useCallback(
    (handle: "min" | "max") => (e: React.TouchEvent) => {
      e.preventDefault()
      setIsDragging(handle)
      setDragStartValue(value)
    },
    [value],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return

      const bounds = getSliderBounds()
      const clientX = e.clientX - bounds.left
      const newValue = positionToValue(clientX, bounds)

      if (isDragging === "min") {
        const newMin = Math.max(min, Math.min(newValue, value[1] - step))
        onChange([newMin, value[1]])
      } else {
        const newMax = Math.min(max, Math.max(newValue, value[0] + step))
        onChange([value[0], newMax])
      }
    },
    [isDragging, value, onChange, getSliderBounds, positionToValue, min, max, step],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current) return

      e.preventDefault()
      const bounds = getSliderBounds()
      const touch = e.touches[0]
      const clientX = touch.clientX - bounds.left
      const newValue = positionToValue(clientX, bounds)

      if (isDragging === "min") {
        const newMin = Math.max(min, Math.min(newValue, value[1] - step))
        onChange([newMin, value[1]])
      } else {
        const newMax = Math.min(max, Math.max(newValue, value[0] + step))
        onChange([value[0], newMax])
      }
    },
    [isDragging, value, onChange, getSliderBounds, positionToValue, min, max, step],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    document.body.style.userSelect = ""
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handleKeyDown = useCallback(
    (handle: "min" | "max") => (e: React.KeyboardEvent) => {
      const newValue = [...value]
      const increment = e.shiftKey ? step * 5 : step

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = Math.max(min, value[0] - increment)
          } else {
            newValue[1] = Math.max(value[0] + step, value[1] - increment)
          }
          onChange(newValue)
          break
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = Math.min(value[1] - step, value[0] + increment)
          } else {
            newValue[1] = Math.min(max, value[1] + increment)
          }
          onChange(newValue)
          break
        case "Home":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = min
          } else {
            newValue[1] = max
          }
          onChange(newValue)
          break
        case "End":
          e.preventDefault()
          if (handle === "min") {
            newValue[0] = value[1] - step
          } else {
            newValue[1] = max
          }
          onChange(newValue)
          break
      }
    },
    [value, onChange, min, max, step],
  )

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {/* Custom Slider Container */}
      <div
        ref={sliderRef}
        className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value[1]}
        aria-valuetext={`${formatValue(value[0])} to ${formatValue(value[1])}`}
        tabIndex={-1}
      >
        {/* Track Fill */}
        <div
          className="absolute h-full bg-yellow-500 rounded-full transition-all duration-150"
          style={{
            left: `${valueToPosition(value[0])}%`,
            width: `${valueToPosition(value[1]) - valueToPosition(value[0])}%`,
          }}
        />

        {/* Min Handle */}
        <div
          ref={minHandleRef}
          className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full shadow-md cursor-grab transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
            isDragging === "min" ? "cursor-grabbing scale-110 ring-2 ring-yellow-500 ring-offset-2" : ""
          }`}
          style={{ left: `${valueToPosition(value[0])}%` }}
          onMouseDown={handleMouseDown("min")}
          onTouchStart={handleTouchStart("min")}
          onKeyDown={handleKeyDown("min")}
          role="slider"
          aria-label={`${label} minimum value`}
          aria-valuemin={min}
          aria-valuemax={value[1] - step}
          aria-valuenow={value[0]}
          aria-valuetext={formatValue(value[0])}
          tabIndex={0}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        </div>

        {/* Max Handle */}
        <div
          ref={maxHandleRef}
          className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-yellow-500 rounded-full shadow-md cursor-grab transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
            isDragging === "max" ? "cursor-grabbing scale-110 ring-2 ring-yellow-500 ring-offset-2" : ""
          }`}
          style={{ left: `${valueToPosition(value[1])}%` }}
          onMouseDown={handleMouseDown("max")}
          onTouchStart={handleTouchStart("max")}
          onKeyDown={handleKeyDown("max")}
          role="slider"
          aria-label={`${label} maximum value`}
          aria-valuemin={value[0] + step}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          aria-valuetext={formatValue(value[1])}
          tabIndex={0}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Value Display */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{formatValue(value[0])}</span>
        <span className="font-medium">{formatValue(value[1])}</span>
      </div>

      {/* Instructions for screen readers */}
      <div className="sr-only" aria-live="polite">
        Current range: {formatValue(value[0])} to {formatValue(value[1])}. Use arrow keys to adjust values, Shift+arrow
        for larger steps, Home/End for min/max values.
      </div>
    </div>
  )
}

interface PropertyFiltersProps {
  criteria: PropertyCriteria
  onUpdate: (values: Partial<PropertyCriteria>) => void
}

export function PropertyFilters({ criteria, onUpdate }: PropertyFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["property-type"])
  const [showTemplates, setShowTemplates] = useState(false)
  const [customRanges, setCustomRanges] = useState({
    squareFootage: { min: "", max: "" },
    yearBuilt: { min: "", max: "" },
    bedrooms: { min: "", max: "" },
    bathrooms: { min: "", max: "" },
    lotSize: { min: "", max: "" },
    propertyValue: { min: "", max: "" },
  })

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }, [])

  const handlePropertyTypeChange = useCallback(
    (type: string, checked: boolean) => {
      const newTypes = checked ? [...criteria.propertyTypes, type] : criteria.propertyTypes.filter((t) => t !== type)
      onUpdate({ propertyTypes: newTypes })
    },
    [criteria.propertyTypes, onUpdate],
  )

  const handleRangeChange = useCallback(
    (field: keyof PropertyCriteria, value: number[]) => {
      onUpdate({ [field]: value })
    },
    [onUpdate],
  )

  const handleCustomRangeInput = useCallback((field: string, type: "min" | "max", value: string) => {
    setCustomRanges((prev) => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev], [type]: value },
    }))
  }, [])

  const applyCustomRange = useCallback(
    (field: keyof PropertyCriteria) => {
      const customRange = customRanges[field as keyof typeof customRanges]
      const min = Number(customRange.min) || 0
      const max = Number(customRange.max) || getMaxValue(field)

      if (min <= max) {
        onUpdate({ [field]: [min, max] })
        setCustomRanges((prev) => ({
          ...prev,
          [field]: { min: "", max: "" },
        }))
      }
    },
    [customRanges, onUpdate],
  )

  const applyTemplate = useCallback(
    (template: (typeof CRITERIA_TEMPLATES)[0]) => {
      onUpdate(template.criteria)
      setShowTemplates(false)
    },
    [onUpdate],
  )

  const resetCriteria = useCallback(() => {
    onUpdate({
      propertyTypes: [],
      yearBuilt: [1900, new Date().getFullYear()],
      squareFootage: [500, 10000],
      bedrooms: [1, 8],
      bathrooms: [1, 8],
      lotSize: [0.1, 10],
      propertyValue: [50000, 2000000],
    })
  }, [onUpdate])

  const getMaxValue = (field: keyof PropertyCriteria): number => {
    switch (field) {
      case "yearBuilt":
        return new Date().getFullYear()
      case "squareFootage":
        return 15000
      case "bedrooms":
        return 10
      case "bathrooms":
        return 10
      case "lotSize":
        return 50
      case "propertyValue":
        return 5000000
      default:
        return 1000
    }
  }

  const formatValue = (field: keyof PropertyCriteria, value: number): string => {
    switch (field) {
      case "yearBuilt":
        return value.toString()
      case "squareFootage":
        return `${value.toLocaleString()} sq ft`
      case "bedrooms":
      case "bathrooms":
        return value === getMaxValue(field) ? `${value}+` : value.toString()
      case "lotSize":
        return value >= 1 ? `${value} acres` : `${(value * 43560).toLocaleString()} sq ft`
      case "propertyValue":
        return value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${(value / 1000).toFixed(0)}K`
      default:
        return value.toString()
    }
  }

  const getSelectedTypesCount = () => criteria.propertyTypes.length
  const hasActiveFilters = () => {
    return (
      criteria.propertyTypes.length > 0 ||
      criteria.yearBuilt[0] !== 1900 ||
      criteria.yearBuilt[1] !== new Date().getFullYear() ||
      criteria.squareFootage[0] !== 500 ||
      criteria.squareFootage[1] !== 10000 ||
      criteria.bedrooms[0] !== 1 ||
      criteria.bedrooms[1] !== 8 ||
      criteria.bathrooms[0] !== 1 ||
      criteria.bathrooms[1] !== 8 ||
      criteria.lotSize[0] !== 0.1 ||
      criteria.lotSize[1] !== 10 ||
      criteria.propertyValue[0] !== 50000 ||
      criteria.propertyValue[1] !== 2000000
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Filter properties by physical characteristics, value, and features</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="bg-transparent"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Templates
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use predefined property criteria templates</p>
                </TooltipContent>
              </Tooltip>
              {hasActiveFilters() && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCriteria}
                      className="bg-transparent text-red-600 hover:text-red-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all property criteria to defaults</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Templates Section */}
          {showTemplates && (
            <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Templates</CardTitle>
                <CardDescription>Apply common property criteria combinations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CRITERIA_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="h-auto p-3 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => applyTemplate(template)}
                    >
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Type Section */}
          <Card className="border-l-4 border-l-yellow-500">
            <Collapsible
              open={expandedSections.includes("property-type")}
              onOpenChange={() => toggleSection("property-type")}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">Property Type</CardTitle>
                      <CardDescription>
                        Select the types of properties to include
                        {getSelectedTypesCount() > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {getSelectedTypesCount()} selected
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {expandedSections.includes("property-type") ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-6">
                    {PROPERTY_TYPES.map((category) => (
                      <div key={category.category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <category.icon className={`h-4 w-4 ${category.color}`} />
                          <Label className="font-semibold">{category.category}</Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                          {category.types.map((type) => (
                            <div key={type.value} className="flex items-start space-x-2">
                              <Checkbox
                                id={`type-${type.value}`}
                                checked={criteria.propertyTypes.includes(type.value)}
                                onCheckedChange={(checked) => handlePropertyTypeChange(type.value, !!checked)}
                                className="mt-0.5"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`type-${type.value}`}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {type.label}
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {criteria.propertyTypes.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium">Selected Types:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {criteria.propertyTypes.map((type) => {
                          const typeInfo = PROPERTY_TYPES.flatMap((cat) => cat.types).find((t) => t.value === type)
                          return (
                            <Badge key={type} variant="secondary">
                              {typeInfo?.label || type}
                              <button
                                onClick={() => handlePropertyTypeChange(type, false)}
                                className="ml-1 rounded-full hover:bg-gray-400/20 p-0.5"
                                aria-label={`Remove ${typeInfo?.label || type}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Property Value Section */}
          <PropertyRangeSection
            title="Property Value"
            description="Filter by estimated property value"
            field="propertyValue"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("propertyValue", value)}
            min={50000}
            max={5000000}
            step={25000}
            customRange={customRanges.propertyValue}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("property-value")}
            onToggle={() => toggleSection("property-value")}
            icon={<Home className="h-4 w-4 text-green-500" />}
            helpText="Property values are estimated based on recent sales and assessments"
          />

          {/* Square Footage Section */}
          <PropertyRangeSection
            title="Square Footage"
            description="Filter by building square footage"
            field="squareFootage"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("squareFootage", value)}
            min={500}
            max={15000}
            step={100}
            customRange={customRanges.squareFootage}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("square-footage")}
            onToggle={() => toggleSection("square-footage")}
            icon={<Building className="h-4 w-4 text-blue-500" />}
            helpText="Total finished square footage of the building"
          />

          {/* Year Built Section */}
          <PropertyRangeSection
            title="Year Built"
            description="Filter by construction year"
            field="yearBuilt"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("yearBuilt", value)}
            min={1900}
            max={new Date().getFullYear()}
            step={1}
            customRange={customRanges.yearBuilt}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("year-built")}
            onToggle={() => toggleSection("year-built")}
            icon={<Factory className="h-4 w-4 text-orange-500" />}
            helpText="Year the property was originally constructed"
          />

          {/* Bedrooms Section */}
          <PropertyRangeSection
            title="Bedrooms"
            description="Number of bedrooms"
            field="bedrooms"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("bedrooms", value)}
            min={1}
            max={10}
            step={1}
            customRange={customRanges.bedrooms}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("bedrooms")}
            onToggle={() => toggleSection("bedrooms")}
            icon={<Home className="h-4 w-4 text-purple-500" />}
            helpText="Number of bedrooms in residential properties"
            residentialOnly
          />

          {/* Bathrooms Section */}
          <PropertyRangeSection
            title="Bathrooms"
            description="Number of bathrooms"
            field="bathrooms"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("bathrooms", value)}
            min={1}
            max={10}
            step={1}
            customRange={customRanges.bathrooms}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("bathrooms")}
            onToggle={() => toggleSection("bathrooms")}
            icon={<Home className="h-4 w-4 text-cyan-500" />}
            helpText="Number of bathrooms in residential properties"
            residentialOnly
          />

          {/* Lot Size Section */}
          <PropertyRangeSection
            title="Lot Size"
            description="Property lot size in acres"
            field="lotSize"
            criteria={criteria}
            onUpdate={handleRangeChange}
            formatValue={(value) => formatValue("lotSize", value)}
            min={0.1}
            max={50}
            step={0.1}
            customRange={customRanges.lotSize}
            onCustomRangeInput={handleCustomRangeInput}
            onApplyCustomRange={applyCustomRange}
            expanded={expandedSections.includes("lot-size")}
            onToggle={() => toggleSection("lot-size")}
            icon={<TreePine className="h-4 w-4 text-green-600" />}
            helpText="Total lot size including all land area"
          />

          {/* Summary Section */}
          {hasActiveFilters() && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Active Property Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {criteria.propertyTypes.length > 0 && (
                    <div>
                      <span className="font-medium">Property Types:</span> {criteria.propertyTypes.length} selected
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Property Value:</span>{" "}
                    {formatValue("propertyValue", criteria.propertyValue[0])} -{" "}
                    {formatValue("propertyValue", criteria.propertyValue[1])}
                  </div>
                  <div>
                    <span className="font-medium">Square Footage:</span>{" "}
                    {formatValue("squareFootage", criteria.squareFootage[0])} -{" "}
                    {formatValue("squareFootage", criteria.squareFootage[1])}
                  </div>
                  <div>
                    <span className="font-medium">Year Built:</span> {formatValue("yearBuilt", criteria.yearBuilt[0])} -{" "}
                    {formatValue("yearBuilt", criteria.yearBuilt[1])}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Reusable Property Range Section Component
interface PropertyRangeSectionProps {
  title: string
  description: string
  field: keyof PropertyCriteria
  criteria: PropertyCriteria
  onUpdate: (field: keyof PropertyCriteria, value: number[]) => void
  formatValue: (value: number) => string
  min: number
  max: number
  step: number
  customRange: { min: string; max: string }
  onCustomRangeInput: (field: string, type: "min" | "max", value: string) => void
  onApplyCustomRange: (field: keyof PropertyCriteria) => void
  expanded: boolean
  onToggle: () => void
  icon: React.ReactNode
  helpText: string
  residentialOnly?: boolean
}

function PropertyRangeSection({
  title,
  description,
  field,
  criteria,
  onUpdate,
  formatValue,
  min,
  max,
  step,
  customRange,
  onCustomRangeInput,
  onApplyCustomRange,
  expanded,
  onToggle,
  icon,
  helpText,
  residentialOnly = false,
}: PropertyRangeSectionProps) {
  const currentValue = criteria[field] as number[]
  const isDefault = currentValue[0] === min && currentValue[1] === max

  return (
    <Card className="border-l-4 border-l-yellow-500">
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <div>
                  <CardTitle className="text-base font-medium">{title}</CardTitle>
                  <CardDescription>
                    {description}
                    {!isDefault && (
                      <Badge variant="secondary" className="ml-2">
                        {formatValue(currentValue[0])} - {formatValue(currentValue[1])}
                      </Badge>
                    )}
                    {residentialOnly && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Residential Only
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <HelpCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{helpText}</p>
                  </TooltipContent>
                </Tooltip>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-6">
              {/* Draggable Slider */}
              <DraggableSlider
                label={`${title} Range`}
                value={currentValue}
                min={min}
                max={max}
                step={step}
                formatValue={formatValue}
                onChange={(value) => onUpdate(field, value)}
                ariaLabel={`${title} range selector`}
              />

              <Separator />

              {/* Custom Range Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Custom Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`${field}-min`} className="text-xs text-gray-500">
                      Minimum
                    </Label>
                    <Input
                      id={`${field}-min`}
                      type="number"
                      placeholder={min.toString()}
                      value={customRange.min}
                      onChange={(e) => onCustomRangeInput(field, "min", e.target.value)}
                      min={min}
                      max={max}
                      step={step}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${field}-max`} className="text-xs text-gray-500">
                      Maximum
                    </Label>
                    <Input
                      id={`${field}-max`}
                      type="number"
                      placeholder={max.toString()}
                      value={customRange.max}
                      onChange={(e) => onCustomRangeInput(field, "max", e.target.value)}
                      min={min}
                      max={max}
                      step={step}
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => onApplyCustomRange(field)}
                  disabled={!customRange.min && !customRange.max}
                  size="sm"
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {getPresets(field, min, max).map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate(field, preset.value)}
                      className="text-xs bg-transparent"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

// Helper function to get presets for different fields
function getPresets(field: keyof PropertyCriteria, min: number, max: number) {
  switch (field) {
    case "propertyValue":
      return [
        { label: "Under $200K", value: [50000, 200000] },
        { label: "$200K-$500K", value: [200000, 500000] },
        { label: "$500K-$1M", value: [500000, 1000000] },
        { label: "Over $1M", value: [1000000, max] },
      ]
    case "squareFootage":
      return [
        { label: "Under 1,500", value: [min, 1500] },
        { label: "1,500-3,000", value: [1500, 3000] },
        { label: "3,000-5,000", value: [3000, 5000] },
        { label: "Over 5,000", value: [5000, max] },
      ]
    case "yearBuilt":
      return [
        { label: "Historic (Pre-1950)", value: [min, 1950] },
        { label: "Mid-Century (1950-1980)", value: [1950, 1980] },
        { label: "Modern (1980-2000)", value: [1980, 2000] },
        { label: "New (2000+)", value: [2000, max] },
      ]
    case "bedrooms":
      return [
        { label: "1-2 BR", value: [1, 2] },
        { label: "3-4 BR", value: [3, 4] },
        { label: "5+ BR", value: [5, max] },
      ]
    case "bathrooms":
      return [
        { label: "1-2 BA", value: [1, 2] },
        { label: "3-4 BA", value: [3, 4] },
        { label: "5+ BA", value: [5, max] },
      ]
    case "lotSize":
      return [
        { label: "Under 0.5 acres", value: [min, 0.5] },
        { label: "0.5-1 acre", value: [0.5, 1] },
        { label: "1-5 acres", value: [1, 5] },
        { label: "Over 5 acres", value: [5, max] },
      ]
    default:
      return []
  }
}
