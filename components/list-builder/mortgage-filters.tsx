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
import { DraggableSlider } from "./mortgage-filters/draggable-slider"
import { 
  MORTGAGE_CRITERIA_OPTIONS, 
  LOAN_TYPE_OPTIONS, 
  MORTGAGE_TEMPLATES, 
  MortgageCriteriaOption 
} from "./mortgage-filters/lib/constants"
import { 
  validateMortgageAmount, 
  validateInterestRate, 
  validateDateRange 
} from "./mortgage-filters/lib/validation"
import { MortgageAmountFilter } from "./mortgage-filters/filters/mortgage-amount-filter"
import { InterestRateFilter } from "./mortgage-filters/filters/interest-rate-filter"
import { LoanToValueFilter } from "./mortgage-filters/filters/loan-to-value-filter"
import { OriginationDateFilter } from "./mortgage-filters/filters/origination-date-filter"
import { MaturityDateFilter } from "./mortgage-filters/filters/maturity-date-filter"
import { MortgageTermFilter } from "./mortgage-filters/filters/mortgage-term-filter"
import { LoanTypeFilter } from "./mortgage-filters/filters/loan-type-filter"
import { LenderOriginationFilter } from "./mortgage-filters/filters/lender-origination-filter"
import { LenderAssignedFilter } from "./mortgage-filters/filters/lender-assigned-filter"
import { AdjustableRateRiderFilter } from "./mortgage-filters/filters/adjustable-rate-rider-filter"
import { BooleanCriterionFilter } from "./mortgage-filters/filters/boolean-criterion-filter"


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
      setExpandedPanels(template.criteria.selectedCriteria || [])
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
        return <MortgageAmountFilter criteria={criteria} onUpdate={onUpdate} validationError={validationErrors["mortgageAmount"]} />
      case "interest-rate":
        return <InterestRateFilter criteria={criteria} onUpdate={onUpdate} validationError={validationErrors["interestRate"]} />
      case "loan-to-value":
        return <LoanToValueFilter criteria={criteria} onUpdate={onUpdate} />
      case "mortgage-origination-date":
        return <OriginationDateFilter criteria={criteria} onUpdate={onUpdate} />
      case "maturity-date":
        return <MaturityDateFilter criteria={criteria} onUpdate={onUpdate} />
      case "mortgage-term":
        return <MortgageTermFilter criteria={criteria} onUpdate={onUpdate} />
      case "primary-loan-type":
        return <LoanTypeFilter criteria={criteria} onUpdate={onUpdate} />
      case "lender-origination":
        return <LenderOriginationFilter criteria={criteria} onUpdate={onUpdate} />
      case "lender-assigned":
        return <LenderAssignedFilter criteria={criteria} onUpdate={onUpdate} />
      case "adjustable-rate-rider":
        return <AdjustableRateRiderFilter criteria={criteria} onUpdate={onUpdate} />
      case "balloon-loan":
        return (
          <BooleanCriterionFilter
            field="balloonLoan"
            title="Balloon Loan"
            description="Mortgages with balloon payment features"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      case "credit-line-loan":
        return (
          <BooleanCriterionFilter
            field="creditLineLoan"
            title="Credit Line Loan"
            description="Home equity lines of credit and similar products"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      case "equity-loan":
        return (
          <BooleanCriterionFilter
            field="equityLoan"
            title="Equity Loan"
            description="Home equity loans and second mortgages"
            criteria={criteria}
            onUpdate={onUpdate}
          />
        )
      case "matured-mortgage":
        return (
          <BooleanCriterionFilter
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


