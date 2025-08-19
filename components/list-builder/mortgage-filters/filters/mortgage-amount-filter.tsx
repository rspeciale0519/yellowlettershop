"use client"

import { DraggableSlider } from "../draggable-slider"
import type { MortgageCriteria } from "@/types/list-builder"

type MortgageAmountFilterProps = {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
  validationError: string | undefined
}

export function MortgageAmountFilter({ criteria, onUpdate, validationError }: MortgageAmountFilterProps) {
  return (
    <div className="space-y-4 p-4 border-t">
      <DraggableSlider
        label="Mortgage Amount"
        value={[criteria.mortgageAmount?.min ?? 1000, criteria.mortgageAmount?.max ?? 50000000]}
        min={1000}
        max={50000000}
        step={1000}
        formatValue={value => `$${(value / 1000).toLocaleString()}K`}
        onChange={([min, max]) => onUpdate({ mortgageAmount: { min, max } })}
        ariaLabel="Mortgage Amount Range"
        tooltip="Filter properties by the total mortgage amount."
      />
      {validationError && <p className="text-sm text-red-500">{validationError}</p>}
    </div>
  )
}
