"use client"

import { DraggableSlider } from "../draggable-slider"
import type { MortgageCriteria } from "@/types/list-builder"
import { Percent } from "lucide-react"

interface InterestRateFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
  validationError: string | undefined
}

export function InterestRateFilter({ criteria, onUpdate, validationError }: InterestRateFilterProps) {
  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter properties by interest rate percentage.</p>
      <DraggableSlider
        label="Interest Rate Range"
        value={[criteria.interestRate?.min || 0.001, criteria.interestRate?.max || 10]}
        min={0.001}
        max={30}
        step={0.001}
        formatValue={(value) => `${value.toFixed(3)}%`}
        onChange={([min, max]) => onUpdate({ interestRate: { min, max } })}
        ariaLabel="Interest rate range selector"
        icon={<Percent className="h-4 w-4 text-blue-500" />}
        tooltip="Filter by the current or original interest rate"
      />
      {validationError && <p className="text-sm text-red-500">{validationError}</p>}
      <div className="text-xs text-gray-500 dark:text-gray-400">Enter rates between 0.001% and 30%</div>
    </div>
  )
}
