"use client"

import { DraggableSlider } from "../draggable-slider"
import type { MortgageCriteria } from "@/types/list-builder"
import { Percent } from "lucide-react"

interface LoanToValueFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function LoanToValueFilter({ criteria, onUpdate }: LoanToValueFilterProps) {
  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by loan-to-value ratio percentage.</p>
      <DraggableSlider
        label="Loan-to-Value Ratio Range"
        value={[criteria.loanToValue?.min || 1, criteria.loanToValue?.max || 100]}
        min={1}
        max={200}
        step={1}
        formatValue={(value) => `${value}%`}
        onChange={([min, max]) => onUpdate({ loanToValue: { min, max } })}
        ariaLabel="Loan-to-value ratio range selector"
        icon={<Percent className="h-4 w-4 text-purple-500" />}
        tooltip="Filter by the ratio of loan amount to property value"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">LTV ratios typically range from 1% to 200%</div>
    </div>
  )
}
