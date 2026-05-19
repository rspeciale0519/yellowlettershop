"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { controlClass, labelClass } from "@/components/designer/inspector/inspector-styles"

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="space-y-1">
      <Label className={labelClass}>{label}</Label>
      <Input
        className={controlClass}
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}
