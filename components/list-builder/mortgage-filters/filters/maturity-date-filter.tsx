"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import { DateRangePicker } from "../components/date-range-picker"

interface MaturityDateFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function MaturityDateFilter({ criteria, onUpdate }: MaturityDateFilterProps) {
  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by mortgage maturity date range.</p>
      <DateRangePicker
        label="Maturity date"
        value={criteria.maturityDate ?? undefined}
        onChange={(range) => onUpdate({ maturityDate: range ?? null })}
      />
    </div>
  )
}
