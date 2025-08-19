"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export type ThreeOption = "only" | "exclude" | "no-preference"

interface ThreeOptionToggleProps {
  label: string
  value: ThreeOption
  onChange: (value: ThreeOption) => void
}

export function ThreeOptionToggle({ label, value, onChange }: ThreeOptionToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as ThreeOption)}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem id={`${label}-only`} value="only" />
          <Label htmlFor={`${label}-only`} className="text-sm">Only</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem id={`${label}-exclude`} value="exclude" />
          <Label htmlFor={`${label}-exclude`} className="text-sm">Exclude</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem id={`${label}-nopref`} value="no-preference" />
          <Label htmlFor={`${label}-nopref`} className="text-sm">No preference</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
