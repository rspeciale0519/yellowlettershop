"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import { DateRangePicker } from "../components/date-range-picker"

interface OriginationDateFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function OriginationDateFilter({ criteria, onUpdate }: OriginationDateFilterProps) {
  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">Filter by mortgage origination date range.</p>
      <DateRangePicker
        label="Origination date"
        value={criteria.mortgageOriginationDate ?? undefined}
        onChange={(range) => onUpdate({ mortgageOriginationDate: range ?? null })}
      />
    </div>
  )
}
