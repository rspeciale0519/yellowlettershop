// ARCHIVED (Rule 1) — original pre-overhaul Inspector, replaced in Phase 5 by
// the modular components/designer/inspector/* (thin router + per-type panels +
// unified TransformSection). Preserved verbatim for history/recovery.
"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { AlignCenter, AlignLeft, AlignRight, Droplet, ImageIcon, Maximize2, Move, Tags, Type } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type DesignerFont } from "@/components/designer/designer-fonts"
import { imageSourceUrl } from "@/components/designer/image-source-url"
import { MERGE_FIELDS, tokenForField } from "@/components/designer/merge-fields"
import type { CanvasSize, DesignElement } from "@/types/designer"

const FONT_SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96]
const controlClass = "h-10 border-slate-700 bg-slate-950/70 text-white placeholder:text-slate-500 focus-visible:ring-yellow-400"
const selectClass = `${controlClass} w-full rounded-md border px-3 text-sm`
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-slate-400"

interface InspectorPanelProps {
  element: DesignElement | null
  fonts: DesignerFont[]
  canvasSize: CanvasSize
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
}

function NumberField({ label, value, onChange }: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1">
      <Label className={labelClass}>{label}</Label>
      <Input className={controlClass} type="number" value={Math.round(value)} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  )
}
function InspectorSection({ title, icon: Icon, children }: {
  title: string
  icon: typeof Type
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-700/70 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-400/15 text-yellow-300">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
function FontSizeField({ value, onChange }: {
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
          className="absolute inset-y-0 right-1 flex w-7 items-center justify-center rounded text-xs text-slate-400 hover:bg-slate-800 hover:text-yellow-300"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsOpen((open) => !open)}
        >
          v
        </button>
      </div>
      {isOpen && (
        <div
          id="designer-font-size-options"
          role="listbox"
          className="absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-slate-700 bg-slate-950 py-1 shadow-xl"
        >
          {FONT_SIZE_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              role="option"
              aria-selected={size === roundedValue}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-yellow-400/10 ${
                size === roundedValue ? "bg-yellow-400/20 text-yellow-200" : "text-slate-200"
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

export function InspectorPanel({ element, fonts, canvasSize, onUpdateElement }: InspectorPanelProps) {
  if (!element) {
    return (
      <div className="space-y-4 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-50">Inspector</h2>
          <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Select a layer or canvas object to edit its settings.
          </p>
        </div>
      </div>
    )
  }
  return null
}
