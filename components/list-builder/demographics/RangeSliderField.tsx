"use client"

import type React from "react"
import { DraggableSlider } from "@/components/list-builder/common/draggable-slider"

export interface RangeSliderFieldProps {
  label: string
  value: [number, number]
  min: number
  max: number
  step?: number
  onChange: (value: [number, number]) => void
  formatValue?: (value: number) => string
  icon?: React.ReactNode
  tooltip?: string
  ariaLabel?: string
}

export function RangeSliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  icon,
  tooltip,
  ariaLabel
}: RangeSliderFieldProps) {
  return (
    <DraggableSlider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      formatValue={formatValue}
      icon={icon}
      tooltip={tooltip}
      ariaLabel={ariaLabel}
    />
  )
}