"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import { Button } from "@/components/ui/button"
import { LOAN_TYPE_OPTIONS } from "../lib/constants"

interface LoanTypeFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function LoanTypeFilter({ criteria, onUpdate }: LoanTypeFilterProps) {
  const handleLoanTypeToggle = (type: string) => {
    const currentTypes = criteria.primaryLoanType || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type]
    onUpdate({ primaryLoanType: newTypes })
  }

  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">Select loan types to include in your search.</p>
      <div className="grid grid-cols-3 gap-2">
        {LOAN_TYPE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={criteria.primaryLoanType?.includes(option.value) ? "default" : "outline"}
            size="sm"
            onClick={() => handleLoanTypeToggle(option.value)}
            className="text-xs justify-start"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
