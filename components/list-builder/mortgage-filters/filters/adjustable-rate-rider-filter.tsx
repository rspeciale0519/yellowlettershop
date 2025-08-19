"use client"

import type { MortgageCriteria } from "@/types/list-builder"
import { ThreeOptionToggle, type ThreeOption } from "../components/three-option-toggle"
import { useCriterionUpdate } from "@/hooks/use-criterion-update"

interface AdjustableRateRiderFilterProps {
  criteria: MortgageCriteria
  onUpdate: (values: Partial<MortgageCriteria>) => void
}

export function AdjustableRateRiderFilter({ criteria, onUpdate }: AdjustableRateRiderFilterProps) {
  const { mergeUpdate } = useCriterionUpdate<MortgageCriteria>(onUpdate)
  const arr = criteria.adjustableRateRider

  const updateArr = (
    key: keyof Pick<typeof arr, "interestOnly" | "negativeAmortization" | "paymentOption" | "prepaymentPenalty">,
    value: ThreeOption,
  ) => {
    mergeUpdate({
      adjustableRateRider: {
        ...arr,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-4 p-4 border-t">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Adjustable Rate Rider (ARR) criteria allow you to target properties with adjustable rate mortgages.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ThreeOptionToggle
          label="Interest Only"
          value={arr.interestOnly}
          onChange={(v) => updateArr("interestOnly", v)}
        />
        <ThreeOptionToggle
          label="Negative Amortization"
          value={arr.negativeAmortization}
          onChange={(v) => updateArr("negativeAmortization", v)}
        />
        <ThreeOptionToggle
          label="Payment Option"
          value={arr.paymentOption}
          onChange={(v) => updateArr("paymentOption", v)}
        />
        <ThreeOptionToggle
          label="Prepayment Penalty"
          value={arr.prepaymentPenalty}
          onChange={(v) => updateArr("prepaymentPenalty", v)}
        />
      </div>
    </div>
  )
}
