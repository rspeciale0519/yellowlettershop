"use client";

import { useRef } from "react"

import type React from "react"

import { useState, useCallback, useEffect, useMemo } from "react"
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
import { useMortgageFiltersCallbacks } from "./mortgage-filters/hooks/useMortgageFiltersCallbacks"
import { CriterionPanel } from "./mortgage-filters/components/CriterionPanel"


interface MortgageFiltersProps {
  criteria: MortgageCriteria | undefined
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function MortgageFilters({ criteria, onUpdate }: MortgageFiltersProps) {
  const [selectedCriterion, setSelectedCriterion] = useState<string>("")
  const [expandedPanels, setExpandedPanels] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showTemplates, setShowTemplates] = useState(false)
  const [savedCriteria, setSavedCriteria] = useState(MORTGAGE_TEMPLATES)

  const safeCriteria = useMemo(() => criteria || {
    selectedCriteria: [],
    lienPosition: "all" as const,
    mortgageAmount: null,
    interestRate: null,
    mortgageOriginationDate: null,
    maturityDate: null
  }, [criteria])

  // Create groupedCriteria inline to avoid server-side import issues
  const groupedCriteria = MORTGAGE_CRITERIA_OPTIONS.reduce(
    (acc, option) => {
      if (!acc[option.category]) acc[option.category] = []
      acc[option.category].push(option)
      return acc
    },
    {} as Record<string, MortgageCriteriaOption[]>,
  )

  // Callback functions
  const addCriterion = (criterion?: string) => {
    if (!criterion) criterion = selectedCriterion;
    if (criterion && !safeCriteria.selectedCriteria.includes(criterion)) {
      onUpdate({ selectedCriteria: [...safeCriteria.selectedCriteria, criterion] });
      setSelectedCriterion("");
      setExpandedPanels(prev => [...prev, criterion]);
    }
  };

  const removeCriterion = (criterion: string) => {
    onUpdate({
      selectedCriteria: safeCriteria.selectedCriteria.filter(c => c !== criterion)
    });
    setExpandedPanels(prev => prev.filter(p => p !== criterion));
  };

  const togglePanel = (criterion: string) => {
    setExpandedPanels(prev => 
      prev.includes(criterion) 
        ? prev.filter(p => p !== criterion)
        : [...prev, criterion]
    );
  };

  const saveCurrentCriteria = () => {
    // Implementation for saving current criteria as template
    console.log("Save current criteria", safeCriteria);
  };

  const applyTemplate = (template: any) => {
    onUpdate(template.criteria);
  };

  const deleteSavedCriteria = (templateId: string) => {
    setSavedCriteria(prev => prev.filter(t => t.id !== templateId));
  };
  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {}

    if (safeCriteria.mortgageAmount) {
      const error = validateMortgageAmount(safeCriteria.mortgageAmount.min, safeCriteria.mortgageAmount.max)
      if (error) errors.mortgageAmount = error
    }

    if (safeCriteria.interestRate) {
      const error = validateInterestRate(safeCriteria.interestRate.min, safeCriteria.interestRate.max)
      if (error) errors.interestRate = error
    }

    if (safeCriteria.mortgageOriginationDate) {
      const error = validateDateRange(safeCriteria.mortgageOriginationDate.from, safeCriteria.mortgageOriginationDate.to)
      if (error) errors.mortgageOriginationDate = error
    }

    if (safeCriteria.maturityDate) {
      const error = validateDateRange(safeCriteria.maturityDate.from, safeCriteria.maturityDate.to)
      if (error) errors.maturityDate = error
    }

    setValidationErrors(errors)
  }, [
    safeCriteria.mortgageAmount,
    safeCriteria.interestRate, 
    safeCriteria.mortgageOriginationDate,
    safeCriteria.maturityDate
  ])

  const handleLienPositionChange = useCallback(
    (value: string) => {
      onUpdate({ lienPosition: value as "all" | "first" | "junior" })
    },
    [onUpdate],
  )

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
              {safeCriteria.selectedCriteria.length > 0 && (
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
              value={safeCriteria.lienPosition}
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
                        {(options as MortgageCriteriaOption[]).map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={safeCriteria.selectedCriteria.includes(option.value)}
                          >
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                              {safeCriteria.selectedCriteria.includes(option.value) && " (Added)"}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={addCriterion}
                      disabled={!selectedCriterion || safeCriteria.selectedCriteria.includes(selectedCriterion)}
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
          {safeCriteria.selectedCriteria.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Selected Criteria</Label>
                <div className="flex flex-wrap gap-1">
                  {safeCriteria.selectedCriteria.map((criterion) => {
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
              <div className="space-y-3">
                {safeCriteria.selectedCriteria.map((criterion) => (
                  <CriterionPanel
                    key={criterion}
                    criterion={criterion}
                    criteria={safeCriteria}
                    onUpdate={onUpdate}
                    validationErrors={validationErrors}
                    onRemove={removeCriterion}
                    isExpanded={expandedPanels.includes(criterion)}
                    onToggle={togglePanel}
                  />
                ))}
              </div>
            </div>
          )}

          {safeCriteria.selectedCriteria.length === 0 && (
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


