"use client"

import type React from "react"
import { MultiSelect } from "@/components/list-builder/common/multi-select"

export interface MultiSelectFieldProps {
  label: string
  options: Array<{ label: string; value: string }>
  values: string[]
  onChange: (values: string[]) => void
  icon?: React.ReactNode
  tooltip?: string
  placeholder?: string
}

export function MultiSelectField({
  label,
  options,
  values,
  onChange,
  icon,
  tooltip,
  placeholder = `Select ${label.toLowerCase()}...`
}: MultiSelectFieldProps) {
  return (
    <MultiSelect
      label={label}
      options={options}
      values={values}
      onChange={onChange}
      icon={icon}
      tooltip={tooltip}
      placeholder={placeholder}
    />
  )
}