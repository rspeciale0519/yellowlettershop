"use client"

import { ChevronDown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { labelClass, selectClass } from "@/components/designer/inspector/inspector-styles"

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className={labelClass}>{label}</Label>
      <div className="relative">
        <select
          className={`${selectClass} appearance-none pr-8`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}
