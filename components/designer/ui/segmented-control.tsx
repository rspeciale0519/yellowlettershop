"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { designerAccent, designerFocus, designerTransition } from "./designer-tokens"

export interface SegmentedOption<T extends string> {
  value: T
  label?: string
  icon?: ReactNode
  ariaLabel?: string
}

/** Branded segmented radio group. Evolves toggle-group-field. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="radiogroup" className={cn("flex rounded-lg border border-input bg-background p-0.5", className)}>
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.ariaLabel ?? opt.label}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium [&_svg]:size-3.5",
              designerTransition,
              designerFocus,
              selected ? designerAccent.solid + " shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label ? <span>{opt.label}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
