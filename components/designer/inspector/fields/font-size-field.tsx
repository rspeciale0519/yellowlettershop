"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { controlClass, labelClass } from "@/components/designer/inspector/inspector-styles"

const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96]

// Moved from inspector-panel.tsx. The only change vs. the original: the caret
// is a real lucide ChevronDown icon instead of a literal "v" character.
export function FontSizeField({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const roundedValue = Math.round(value)
  const [draftValue, setDraftValue] = useState(String(roundedValue))
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setDraftValue(String(roundedValue))
  }, [roundedValue])

  return (
    <div className="relative space-y-1">
      <Label className={labelClass}>Font Size</Label>
      <div className="relative">
        <Input
          aria-expanded={isOpen}
          aria-label="Font size"
          aria-controls="designer-font-size-options"
          inputMode="numeric"
          type="text"
          value={draftValue}
          className={`${controlClass} pr-8`}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            const nextDraftValue = event.target.value
            const nextValue = Number(nextDraftValue)
            setDraftValue(nextDraftValue)
            if (nextDraftValue !== "" && !Number.isNaN(nextValue) && nextValue > 0) {
              onChange(nextValue)
            }
          }}
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          aria-label="Show font size presets"
          className="absolute inset-y-0 right-1 flex w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-yellow-600 dark:hover:text-yellow-300"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen((open) => !open)}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {isOpen && (
        <div
          id="designer-font-size-options"
          role="listbox"
          className="absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-input bg-background py-1 shadow-xl"
        >
          {FONT_SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              role="option"
              aria-selected={size === roundedValue}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-yellow-400/10 ${
                size === roundedValue ? "bg-yellow-400/15 text-yellow-700 dark:text-yellow-300" : "text-foreground"
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(size)
                setDraftValue(String(size))
                setIsOpen(false)
              }}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
