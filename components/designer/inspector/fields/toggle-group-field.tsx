"use client"

import type { LucideIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { labelClass } from "@/components/designer/inspector/inspector-styles"

export interface ToggleOption {
  value: string
  label: string
  icon?: LucideIcon
}

// Single-select toggle group. Generic over option sets (align, weight, fit,
// shape, …). Multi-select pairs (italic/underline) use two single toggles.
export function ToggleGroupField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ToggleOption[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className={labelClass}>{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next)
        }}
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const Icon = option.icon
          return (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
              className="h-9 border border-slate-700 bg-slate-950/70 text-slate-300 data-[state=on]:border-yellow-400 data-[state=on]:bg-yellow-400 data-[state=on]:text-slate-950"
            >
              {Icon ? <Icon className="h-4 w-4" /> : option.label}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
