"use client"

import { useRef } from "react"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Landmark,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Info,
  HelpCircle,
  CalendarIcon,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  Clock,
  Building2,
} from "lucide-react"
import { isValid, parseISO } from "date-fns"
import type { MortgageCriteria } from "@/types/list-builder"

// Draggable Slider Component (standardized with Property filters)
interface DraggableSliderProps {
  label: string
  value: number[]
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  onChange: (value: number[]) => void
  ariaLabel: string
  icon?: React.ReactNode
  tooltip?: string
}

function DraggableSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
  ariaLabel,
  icon,
  tooltip,
}: DraggableSliderProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null)
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
      document.body.style.userSelect = "none"
    },
    [],
  )

  const handleTouchStart = useCallback(
    (handle: "min" | "max") => (e: React.TouchEvent) => {
      e.preventDefault()
      setIsDragging(handle)
    },
    [],
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
      <div className="flex items-center gap-2">
        {icon}
        <Label>{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <HelpCircle className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

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
    </div>
  )
}

// Enhanced mortgage criteria options with descriptions and validation
const MORTGAGE_CRITERIA_OPTIONS = [
  {
    value: "mortgage-amount",
    label: "Mortgage Amount",
    description: "Filter by original loan amount or current balance",
    category: "financial",
    icon: DollarSign,
    validation: { min: 1000, max: 50000000 },
  },
  {
    value: "interest-rate",
    label: "Interest Rate",
    description: "Filter by current or original interest rate percentage",
    category: "financial",
    icon: Percent,
    validation: { min: 0.001, max: 30 },
  },
  {
    value: "loan-to-value",
    label: "Loan-to-Value Ratio",
    description: "Ratio of loan amount to property value",
    category: "financial",
    icon: Percent,
    validation: { min: 1, max: 200 },
  },
  {
    value: "mortgage-origination-date",
    label: "Mortgage Origination Date",
    description: "Date when the mortgage was originally created",
    category: "temporal",
    icon: CalendarIcon,
    validation: { minDate: "1950-01-01", maxDate: new Date().toISOString().split("T")[0] },
  },
  {
    value: "maturity-date",
    label: "Maturity Date",
    description: "Date when the mortgage is scheduled to be paid off",
    category: "temporal",
    icon: Clock,
    validation: { minDate: new Date().toISOString().split("T")[0], maxDate: "2080-12-31" },
  },
  {
    value: "mortgage-term",
    label: "Mortgage Term",
    description: "Length of the mortgage in years",
    category: "terms",
    icon: Clock,
    validation: {},
  },
  {
    value: "primary-loan-type",
    label: "Primary Loan Type",
    description: "Type of mortgage loan (conventional, FHA, VA, etc.)",
    category: "terms",
    icon: Building2,
    validation: {},
  },
  {
    value: "lender-origination",
    label: "Lender - Origination",
    description: "Original lender who issued the mortgage",
    category: "lender",
    icon: Building2,
    validation: {},
  },
  {
    value: "lender-assigned",
    label: "Lender - Current/Assigned",
    description: "Current lender or servicer of the mortgage",
    category: "lender",
    icon: Building2,
    validation: {},
  },
  {
    value: "adjustable-rate-rider",
    label: "Adjustable Rate Rider",
    description: "Properties with adjustable rate mortgage features",
    category: "special",
    icon: Percent,
    validation: {},
  },
  {
    value: "balloon-loan",
    label: "Balloon Loan",
    description: "Mortgages with balloon payment features",
    category: "special",
    icon: DollarSign,
    validation: {},
  },
  {
    value: "credit-line-loan",
    label: "Credit Line Loan",
    description: "Home equity lines of credit and similar products",
    category: "special",
    icon: DollarSign,
    validation: {},
  },
  {
    value: "equity-loan",
    label: "Equity Loan",
    description: "Home equity loans and second mortgages",
    category: "special",
    icon: DollarSign,
    validation: {},
  },
  {
    value: "matured-mortgage",
    label: "Matured Mortgage",
    description: "Mortgages that have reached their maturity date",
    category: "special",
    icon: Clock,
    validation: {},
  },
]

// Enhanced ARM sub-criteria with better organization
const ADJUSTABLE_RATE_SUB_CRITERIA = [
  {
    value: "interest-only",
    label: "Interest Only",
    description: "Loans with interest-only payment periods",
    type: "boolean",
  },
  {
    value: "interest-rate-change-limit",
    label: "Interest Rate % Change Limit",
    description: "Maximum rate change per adjustment period",
    type: "multi-select",
  },
  {
    value: "interest-rate-change",
    label: "Interest Rate Change %",
    description: "Actual rate changes that have occurred",
    type: "range",
  },
  {
    value: "interest-rate-change-date",
    label: "Interest Rate Change Date",
    description: "Dates when rate adjustments occurred or will occur",
    type: "date-range",
  },
  {
    value: "interest-rate-change-frequency",
    label: "Interest Rate Change Frequency",
    description: "How often the rate adjusts",
    type: "multi-select",
  },
  {
    value: "interest-rate-index-type",
    label: "Interest Rate Index Type",
    description: "Index used for rate adjustments",
    type: "multi-select",
  },
  {
    value: "interest-rate-maximum",
    label: "Interest Rate Maximum % (Lifetime Cap)",
    description: "Highest rate the loan can reach",
    type: "range",
  },
  {
    value: "negative-amortization",
    label: "Negative Amortization",
    description: "Loans where balance can increase",
    type: "boolean",
  },
  {
    value: "payment-option",
    label: "Payment Option",
    description: "Flexible payment options available",
    type: "boolean",
  },
  {
    value: "prepayment-penalty",
    label: "Prepayment Penalty",
    description: "Penalties for early loan payoff",
    type: "boolean",
  },
  {
    value: "prepayment-penalty-expire-date",
    label: "Prepayment Penalty Expire Date",
    description: "When prepayment penalties end",
    type: "date-range",
  },
]

// Enhanced data arrays
const INTEREST_RATE_RANGES = [
  { value: "0.001-0.999", label: "0.001% - 0.999%" },
  { value: "1-1.999", label: "1% - 1.999%" },
  { value: "2-2.999", label: "2% - 2.999%" },
  { value: "3-3.999", label: "3% - 3.999%" },
  { value: "4-4.999", label: "4% - 4.999%" },
  { value: "5-5.999", label: "5% - 5.999%" },
  { value: "6-6.999", label: "6% - 6.999%" },
  { value: "7-7.999", label: "7% - 7.999%" },
  { value: "8-8.999", label: "8% - 8.999%" },
  { value: "9-9.999", label: "9% - 9.999%" },
  { value: "10+", label: "10%+" },
]

const CHANGE_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annually", label: "Semi-Annually" },
  { value: "annually", label: "Annually" },
]

const INDEX_TYPES = [
  { value: "libor", label: "LIBOR" },
  { value: "11th-district", label: "11th District Cost of Funds" },
  { value: "prime", label: "Prime Rate" },
  { value: "lama", label: "LAMA (London Interbank Mean Rate)" },
  { value: "cmt", label: "Constant Maturity Treasury" },
  { value: "mta", label: "Monthly Treasury Average" },
  { value: "treasury-bill", label: "Treasury Bill" },
  { value: "fnma", label: "FNMA (Fannie Mae)" },
  { value: "other", label: "Other" },
]

const MORTGAGE_TERMS = [
  { value: "15", label: "15 Year" },
  { value: "20", label: "20 Year" },
  { value: "30", label: "30 Year" },
  { value: "40", label: "40 Year" },
  { value: "other", label: "Other" },
]

const LOAN_TYPES = [
  { value: "conventional", label: "Conventional" },
  { value: "fha", label: "FHA" },
  { value: "va", label: "VA" },
  { value: "usda", label: "USDA" },
  { value: "jumbo", label: "Jumbo" },
  { value: "interest-only", label: "Interest Only" },
  { value: "adjustable-rate", label: "Adjustable Rate" },
  { value: "fixed-rate", label: "Fixed Rate" },
  { value: "other", label: "Other" },
]

// Saved criteria templates
const MORTGAGE_TEMPLATES = [
  {
    id: "high-rate-loans",
    name: "High Interest Rate Loans",
    description: "Loans with interest rates above 6%",
    criteria: {
      selectedCriteria: ["interest-rate"],
      interestRate: { min: 6, max: 30 },
    },
  },
  {
    id: "recent-originations",
    name: "Recent Originations",
    description: "Mortgages originated in the last 2 years",
    criteria: {
      selectedCriteria: ["mortgage-origination-date"],
      mortgageOriginationDate: {
        from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
      },
    },
  },
  {
    id: "large-mortgages",
    name: "Large Mortgages",
    description: "High-value mortgage loans over $500K",
    criteria: {
      selectedCriteria: ["mortgage-amount"],
      mortgageAmount: { min: 500000, max: 50000000 },
    },
  },
]

// Validation functions
const validateMortgageAmount = (min: number, max: number): string | null => {
  if (min < 1000) return "Minimum amount must be at least $1,000"
  if (max > 50000000) return "Maximum amount cannot exceed $50,000,000"
  if (min >= max) return "Minimum must be less than maximum"
  return null
}

const validateInterestRate = (min: number, max: number): string | null => {
  if (min < 0.001) return "Minimum rate must be at least 0.001%"
  if (max > 30) return "Maximum rate cannot exceed 30%"
  if (min >= max) return "Minimum must be less than maximum"
  return null
}

const validateDateRange = (from: string, to: string): string | null => {
  if (!from || !to) return "Both dates are required"
  const fromDate = parseISO(from)
  const toDate = parseISO(to)
  if (!isValid(fromDate) || !isValid(toDate)) return "Invalid date format"
  if (fromDate >= toDate) return "Start date must be before end date"
  return null
}

interface MortgageFiltersProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function MortgageFilters({ criteria, onUpdate }: MortgageFiltersProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>("")
  const [expandedPanels, setExpandedPanels] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showTemplates, setShowTemplates] = useState(false)
  const [savedCriteria, setSavedCriteria] = useState(MORTGAGE_TEMPLATES)

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {}

    if (criteria.mortgageAmount) {
      const error = validateMortgageAmount(criteria.mortgageAmount.min, criteria.mortgageAmount.max)
      if (error) errors.mortgageAmount = error
    }

    if (criteria.interestRate) {
      const error = validateInterestRate(criteria.interestRate.min, criteria.interestRate.max)
      if (error) errors.interestRate = error
    }

    if (criteria.mortgageOriginationDate) {
      const error = validateDateRange(criteria.mortgageOriginationDate.from, criteria.mortgageOriginationDate.to)
      if (error) errors.mortgageOriginationDate = error
    }

    if (criteria.maturityDate) {
      const error = validateDateRange(criteria.maturityDate.from, criteria.maturityDate.to)
      if (error) errors.maturityDate = error
    }

    setValidationErrors(errors)
  }, [criteria])

  const handleLienPositionChange = useCallback(
    (value: string) => {
      onUpdate({ lienPosition: value as "all" | "first" | "junior" })
    },
    [onUpdate],
  )

  const addCriterion = useCallback(() => {
    if (selectedCriterion && !criteria.selectedCriteria.includes(selectedCriterion)) {
      onUpdate({
        selectedCriteria: [...criteria.selectedCriteria, selectedCriterion],
      })
      setExpandedPanels([...expandedPanels, selectedCriterion])
      setSelectedCriterion("")
    }
  }, [selectedCriterion, criteria.selectedCriteria, expandedPanels, onUpdate])

  const removeCriterion = useCallback(
    (criterion: string) => {
      onUpdate({
        selectedCriteria: criteria.selectedCriteria.filter((c) => c !== criterion),
      })
      setExpandedPanels(expandedPanels.filter((p) => p !== criterion))
    },
    [criteria.selectedCriteria, expandedPanels, onUpdate],
  )

  const togglePanel = useCallback((criterion: string) => {
    setExpandedPanels((prev) => (prev.includes(criterion) ? prev.filter((p) => p !== criterion) : [...prev, criterion]))
  }, [])

  const applyTemplate = useCallback(
    (template: (typeof MORTGAGE_TEMPLATES)[0]) => {
      onUpdate(template.criteria)
      setShowTemplates(false)
      // Expand relevant panels
      setExpandedPanels(template.criteria.selectedCriteria)
    },
    [onUpdate],
  )

  const saveCurrentCriteria = useCallback(() => {
    const name = prompt("Enter a name for this criteria set:")
    if (name && name.trim()) {
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        description: "Custom saved criteria",
        criteria: {
          selectedCriteria: criteria.selectedCriteria,
          lienPosition: criteria.lienPosition,
          mortgageAmount: criteria.mortgageAmount,
          interestRate: criteria.interestRate,
          mortgageOriginationDate: criteria.mortgageOriginationDate,
          maturityDate: criteria.maturityDate,
          mortgageTerm: criteria.mortgageTerm,
          primaryLoanType: criteria.primaryLoanType,
        },
      }
      setSavedCriteria([...savedCriteria, newTemplate])
    }
  }, [criteria, savedCriteria])

  const deleteSavedCriteria = useCallback(
    (templateId: string) => {
      setSavedCriteria(savedCriteria.filter((t) => t.id !== templateId))
    },
    [savedCriteria],
  )

  // Group criteria by category
  const groupedCriteria = MORTGAGE_CRITERIA_OPTIONS.reduce(
    (acc, option) => {
      if (!acc[option.category]) acc[option.category] = []
      acc[option.category].push(option)
      return acc
    },
    {} as Record<string, typeof MORTGAGE_CRITERIA_OPTIONS>,
  )

  const renderCriterionPanel = (criterion: string) => {
    const isExpanded = expandedPanels.includes(criterion)
    const criterionData = MORTGAGE_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)
    const hasError = validationErrors[criterion]

    if (!criterionData) return null

    return (
      <Card key={criterion} className={`border-l-4 ${hasError ? "border-l-red-500" : "border-l-yellow-500"}`}>
        <Collapsible open={isExpanded} onOpenChange={() => togglePanel(criterion)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <criterionData.icon className={`h-4 w-4 ${hasError ? "text-red-500" : "text-yellow-500"}`} />
                  <div>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      {criterionData.label}
                      {hasError && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {!hasError && criteria[criterion as keyof MortgageCriteria] && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">{criterionData.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p>{criterionData.description}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCriterion(criterion)
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {hasError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{hasError}</AlertDescription>
                </Alert>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>{renderCriterionContent(criterion)}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    )
  }

  const renderCriterionContent = (criterion: string) => {
    switch (criterion) {
      case "mortgage-amount":
        return <MortgageAmountSection criteria={criteria} onUpdate={onUpdate} />
      case "interest-rate":
        return <InterestRateSection criteria={criteria} onUpdate={onUpdate} />
      case "loan-to-value":
        return <LoanToValueSection criteria={criteria} onUpdate={onUpdate} />
      case "mortgage-origination-date":
        return <OriginationDateSection criteria={criteria} onUpdate={onUpdate} />
      case "maturity-date":
        return <MaturityDateSection criteria={criteria} onUpdate={onUpdate} />
      case "mortgage-term":
        return <MortgageTermSection criteria={criteria} onUpdate={onUpdate} />
      case "primary-loan-type":
        return <LoanTypeSection criteria={criteria} onUpdate={onUpdate} />
      case "lender-origination":
        return <LenderOriginationSection criteria={criteria} onUpdate={onUpdate} />
      case "lender-assigned":
        return <LenderAssignedSection criteria={criteria} onUpdate={onUpdate} />
      case "adjustable-rate-rider":
        return <AdjustableRateRiderSection criteria={criteria} onUpdate={onUpdate} />
      case "balloon-loan":
        return (
          <BooleanCriterionSection
            field="balloonLoan"
            title="Balloon Loan"
            description="Mortgages with balloon payment features"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      case "credit-line-loan":
        return (
          <BooleanCriterionSection
            field="creditLineLoan"
            title="Credit Line Loan"
            description="Home equity lines of credit and similar products"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      case "equity-loan":
        return (
          <BooleanCriterionSection
            field="equityLoan"
            title="Equity Loan"
            description="Home equity loans and second mortgages"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      case "matured-mortgage":
        return (
          <BooleanCriterionSection
            field="maturedMortgage"
            title="Matured Mortgage"
            description="Mortgages that have reached their maturity date"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      default:
        return (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configuration options for {MORTGAGE_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)?.label} will
              be available here.
            </p>
          </div>
        )
    }
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle>Mortgage Details</CardTitle>
                <CardDescription>
                  Search fields related to mortgage amount, dates, lender information, loan-to-value and loan types.
                </CardDescription>
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
                  <p>Use predefined mortgage criteria templates</p>
                </TooltipContent>
              </Tooltip>
              {criteria.selectedCriteria.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveCurrentCriteria}
                      className="bg-transparent text-green-600 hover:text-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save current criteria as template</p>
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
                <CardTitle className="text-base">Mortgage Criteria Templates</CardTitle>
                <CardDescription>Apply common mortgage criteria combinations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedCriteria.map((template) => (
                    <div key={template.id} className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-auto p-3 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => applyTemplate(template)}
                      >
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{template.description}</div>
                        </div>
                      </Button>
                      {template.id.startsWith("custom-") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedCriteria(template.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lien Position Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Lien Position</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <HelpCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>First mortgages have priority over junior mortgages in case of foreclosure</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={criteria.lienPosition}
              onValueChange={handleLienPositionChange}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-mortgages" />
                <Label htmlFor="all-mortgages">All Mortgages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="first" id="first-mortgages" />
                <Label htmlFor="first-mortgages">First Mortgages Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="junior" id="junior-mortgages" />
                <Label htmlFor="junior-mortgages">Junior Mortgages Only</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Criteria Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Select Mortgage Criteria</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <HelpCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose specific mortgage attributes to filter your mailing list</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Grouped Criteria Selection */}
            <div className="space-y-4">
              {Object.entries(groupedCriteria).map(([category, options]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-sm font-medium capitalize text-gray-600 dark:text-gray-400">
                    {category.replace("-", " ")} Criteria
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={selectedCriterion} onValueChange={setSelectedCriterion}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder={`Choose ${category} criterion...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={criteria.selectedCriteria.includes(option.value)}
                          >
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                              {criteria.selectedCriteria.includes(option.value) && " (Added)"}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={addCriterion}
                      disabled={!selectedCriterion || criteria.selectedCriteria.includes(selectedCriterion)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Criteria Panels */}
          {criteria.selectedCriteria.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Selected Criteria</Label>
                <div className="flex flex-wrap gap-1">
                  {criteria.selectedCriteria.map((criterion) => {
                    const hasError = validationErrors[criterion]
                    return (
                      <Badge key={criterion} variant={hasError ? "destructive" : "secondary"} className="text-xs">
                        {MORTGAGE_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)?.label}
                        {hasError && <AlertTriangle className="h-3 w-3 ml-1" />}
                      </Badge>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3">{criteria.selectedCriteria.map(renderCriterionPanel)}</div>
            </div>
          )}

          {criteria.selectedCriteria.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select mortgage criteria above to begin filtering properties by mortgage attributes.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Please fix the validation errors above before proceeding.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Individual criterion sections
function MortgageAmountSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter properties by mortgage amount range.</p>
      <DraggableSlider
        label="Mortgage Amount Range"
        value={[criteria.mortgageAmount?.min || 50000, criteria.mortgageAmount?.max || 1000000]}
        min={1000}
        max={5000000}
        step={1000}
        formatValue={(value) => `$${value.toLocaleString()}`}
        onChange={(value) =>
          onUpdate({
            mortgageAmount: {
              min: value[0],
              max: value[1],
            },
          })
        }
        ariaLabel="Mortgage amount range selector"
        icon={<DollarSign className="h-4 w-4 text-green-500" />}
        tooltip="Filter by the original loan amount or current balance"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">Enter amounts between $1,000 and $5,000,000</div>
    </div>
  )
}

function InterestRateSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter properties by interest rate percentage.</p>
      <DraggableSlider
        label="Interest Rate Range"
        value={[criteria.interestRate?.min || 0.001, criteria.interestRate?.max || 10]}
        min={0.001}
        max={30}
        step={0.001}
        formatValue={(value) => `${value.toFixed(3)}%`}
        onChange={(value) =>
          onUpdate({
            interestRate: {
              min: value[0],
              max: value[1],
            },
          })
        }
        ariaLabel="Interest rate range selector"
        icon={<Percent className="h-4 w-4 text-blue-500" />}
        tooltip="Filter by the current or original interest rate"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">Enter rates between 0.001% and 30%</div>
    </div>
  )
}

function LoanToValueSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by loan-to-value ratio percentage.</p>
      <DraggableSlider
        label="Loan-to-Value Ratio Range"
        value={[criteria.loanToValue?.min || 1, criteria.loanToValue?.max || 100]}
        min={1}
        max={200}
        step={1}
        formatValue={(value) => `${value}%`}
        onChange={(value) =>
          onUpdate({
            loanToValue: {
              min: value[0],
              max: value[1],
            },
          })
        }
        ariaLabel="Loan-to-value ratio range selector"
        icon={<Percent className="h-4 w-4 text-purple-500" />}
        tooltip="Filter by the ratio of loan amount to property value"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">LTV ratios typically range from 1% to 200%</div>
    </div>
  )
}

function OriginationDateSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by mortgage origination date range.</p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Date range selection for mortgage origination will be available here.
        </p>
      </div>
    </div>
  )
}

function MaturityDateSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by mortgage maturity date range.</p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Date range selection for mortgage maturity will be available here.
        </p>
      </div>
    </div>
  )
}

function MortgageTermSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Select mortgage term lengths to include in your search.
      </p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Mortgage term selection will be available here.</p>
      </div>
    </div>
  )
}

function LoanTypeSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Select loan types to include in your search.</p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loan type selection will be available here.</p>
      </div>
    </div>
  )
}

function LenderOriginationSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by original lender names.</p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Lender origination filtering will be available here.</p>
      </div>
    </div>
  )
}

function LenderAssignedSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by current lender or servicer names.</p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Current lender filtering will be available here.</p>
      </div>
    </div>
  )
}

function AdjustableRateRiderSection({
  criteria,
  onUpdate,
}: { criteria: MortgageCriteria; onUpdate: (values: Partial<MortgageCriteria>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Adjustable Rate Rider (ARR) criteria allow you to target properties with adjustable rate mortgages.
      </p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Adjustable rate rider options will be available here.
        </p>
      </div>
    </div>
  )
}

function BooleanCriterionSection({
  field,
  title,
  description,
  criteria,
  onUpdate,
}: {
  field: keyof MortgageCriteria
  title: string
  description: string
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title} options will be available here.</p>
      </div>
    </div>
  )
}
