"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { labelClass } from "@/components/designer/inspector/inspector-styles"

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  format?: (value: number) => string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className={labelClass}>{label}</Label>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0] ?? value)}
      />
    </div>
  )
}
