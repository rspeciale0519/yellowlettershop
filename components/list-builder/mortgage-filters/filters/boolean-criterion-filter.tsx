"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import { ThreeOptionToggle, type ThreeOption } from "../components/three-option-toggle"
import { useCriterionUpdate } from "@/hooks/use-criterion-update"
import { Button } from "@/components/ui/button"

type BooleanField = "balloonLoan" | "creditLineLoan" | "equityLoan" | "maturedMortgage"

interface BooleanCriterionFilterProps {
  field: BooleanField
  title: string
  description: string
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function BooleanCriterionFilter({ 
  field,
  title,
  description,
  criteria,
  onUpdate 
}: BooleanCriterionFilterProps) {
  const { updateField } = useCriterionUpdate<MortgageCriteria>(onUpdate)
  const current = (criteria[field] ?? "no-preference") as ThreeOption
  const handleChange = (v: ThreeOption) => updateField(field, v as MortgageCriteria[typeof field])

  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      <div className="flex items-center gap-2">
        <ThreeOptionToggle label={title} value={current} onChange={handleChange} />
        <Button variant="ghost" size="sm" onClick={() => handleChange("no-preference")}>Reset</Button>
      </div>
    </div>
  )
}
