"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, HelpCircle, ChevronUp, ChevronDown, AlertTriangle, CheckCircle } from "lucide-react"
import type { MortgageCriteria } from "@/types/list-builder"
import { MORTGAGE_CRITERIA_OPTIONS } from "../lib/constants"
import { MortgageAmountFilter } from "../filters/mortgage-amount-filter"
import { InterestRateFilter } from "../filters/interest-rate-filter"
import { LoanToValueFilter } from "../filters/loan-to-value-filter"
import { OriginationDateFilter } from "../filters/origination-date-filter"
import { MaturityDateFilter } from "../filters/maturity-date-filter"
import { MortgageTermFilter } from "../filters/mortgage-term-filter"
import { LoanTypeFilter } from "../filters/loan-type-filter"
import { LenderOriginationFilter } from "../filters/lender-origination-filter"
import { LenderAssignedFilter } from "../filters/lender-assigned-filter"
import { AdjustableRateRiderFilter } from "../filters/adjustable-rate-rider-filter"
import { BooleanCriterionFilter } from "../filters/boolean-criterion-filter"

interface CriterionPanelProps {
  criterion: string
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
  validationErrors: Record<string, string>
  onRemove: (criterion: string) => void
  isExpanded: boolean
  onToggle: (criterion: string) => void
}

export function CriterionPanel({
  criterion,
  criteria,
  onUpdate,
  validationErrors,
  onRemove,
  isExpanded,
  onToggle,
}: CriterionPanelProps) {
  const criterionData = MORTGAGE_CRITERIA_OPTIONS.find((opt) => opt.value === criterion)
  const hasError = validationErrors[criterion]

  if (!criterionData) return null

  return (
    <Card key={criterion} className={`border-l-4 ${hasError ? "border-l-red-500" : "border-l-yellow-500"}`}>
      <Collapsible open={isExpanded} onOpenChange={() => onToggle(criterion)}>
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
                    onRemove(criterion)
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
          <CardContent>{renderCriterionContent(criterion, criteria, onUpdate, validationErrors)}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function renderCriterionContent(
  criterion: string,
  criteria: MortgageCriteria,
  onUpdate: (values: Partial<MortgageCriteria>) => void,
  validationErrors: Record<string, string>
) {
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
