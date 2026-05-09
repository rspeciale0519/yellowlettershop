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

  return (
    <div className="space-y-4 bg-slate-900 p-4 text-slate-100">
      <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Inspector</h2>
            <p className="mt-1 text-xs text-slate-400">Edit the selected module</p>
          </div>
          <span className="rounded-md bg-yellow-400 px-2 py-1 text-[11px] font-bold uppercase text-slate-950">
            {element.type}
          </span>
        </div>
      </div>
      <InspectorSection title="Module" icon={Move}>
        <div className="space-y-1">
          <Label className={labelClass}>Name</Label>
          <Input
            className={controlClass}
            value={element.name}
            onChange={(event) => onUpdateElement(element.id, { name: event.target.value })}
          />
        </div>
      </InspectorSection>
      {element.type === "text" && (
        <>
          <InspectorSection title="Typography" icon={Type}>
            <div className="space-y-1">
              <Label className={labelClass}>Text</Label>
              <Input
                className={controlClass}
                value={element.content}
                onChange={(event) => onUpdateElement(element.id, { content: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Font</Label>
              <select
                className={selectClass}
                value={element.fontFamily ?? "arial"}
                onChange={(event) => onUpdateElement(element.id, { fontFamily: event.target.value })}
              >
                {fonts.filter((font) => font.enabled).map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FontSizeField
                value={element.fontSize}
                onChange={(fontSize) => onUpdateElement(element.id, { fontSize })}
              />
              <div className="space-y-1">
                <Label className={labelClass}>Font Color</Label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-2">
                  <Droplet className="h-4 w-4 text-slate-400" />
                  <Input
                    className="h-7 flex-1 border-0 bg-transparent p-0"
                    type="color"
                    value={element.color ?? "#111827"}
                    onChange={(event) => onUpdateElement(element.id, { color: event.target.value })}
                  />
                </div>
              </div>
            </div>
          </InspectorSection>
          <InspectorSection title="Text Alignment" icon={AlignCenter}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "left", label: "Left", icon: AlignLeft },
                { value: "center", label: "Center", icon: AlignCenter },
                { value: "right", label: "Right", icon: AlignRight },
              ].map((option) => {
                const Icon = option.icon
                const isActive = (element.textAlign ?? "left") === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition ${
                      isActive
                        ? "border-yellow-400 bg-yellow-400 text-slate-950"
                        : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-yellow-400 hover:text-yellow-200"
                    }`}
                    onClick={() => onUpdateElement(element.id, { textAlign: option.value as "left" | "center" | "right" })}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </InspectorSection>
          <InspectorSection title="Module Alignment" icon={Maximize2}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
                onClick={() => onUpdateElement(element.id, { x: canvasSize.width / 2 - element.width / 2 })}
              >
                Center H
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
                onClick={() => onUpdateElement(element.id, { y: canvasSize.height / 2 - element.height / 2 })}
              >
                Center V
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X" value={element.x} onChange={(x) => onUpdateElement(element.id, { x })} />
              <NumberField label="Y" value={element.y} onChange={(y) => onUpdateElement(element.id, { y })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Width" value={element.width} onChange={(width) => onUpdateElement(element.id, { width })} />
              <NumberField label="Height" value={element.height} onChange={(height) => onUpdateElement(element.id, { height })} />
            </div>
          </InspectorSection>
          <InspectorSection title="Merge Fields" icon={Tags}>
            <div className="grid grid-cols-2 gap-2">
              {MERGE_FIELDS.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-left text-xs font-medium text-slate-200 hover:border-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-200"
                  onClick={() => onUpdateElement(element.id, { content: `${element.content} ${tokenForField(field.key)}` })}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </InspectorSection>
        </>
      )}
      {element.type !== "text" && (
        <>
          <InspectorSection title="Module Alignment" icon={Maximize2}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
                onClick={() => onUpdateElement(element.id, { x: canvasSize.width / 2 - element.width / 2 })}
              >
                Center H
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
                onClick={() => onUpdateElement(element.id, { y: canvasSize.height / 2 - element.height / 2 })}
              >
                Center V
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="X" value={element.x} onChange={(x) => onUpdateElement(element.id, { x })} />
              <NumberField label="Y" value={element.y} onChange={(y) => onUpdateElement(element.id, { y })} />
              <NumberField label="Width" value={element.width} onChange={(width) => onUpdateElement(element.id, { width })} />
              <NumberField label="Height" value={element.height} onChange={(height) => onUpdateElement(element.id, { height })} />
            </div>
          </InspectorSection>
        </>
      )}
      {element.type === "qr" && (
        <InspectorSection title="QR Code" icon={Tags}>
          <div className="space-y-1">
            <Label className={labelClass}>QR Value</Label>
            <Input
              className={controlClass}
              value={element.value}
              onChange={(event) => onUpdateElement(element.id, { value: event.target.value })}
            />
          </div>
        </InspectorSection>
      )}
      {element.type === "graphic" && (
        <InspectorSection title="Graphic" icon={Droplet}>
          <div className="space-y-1">
            <Label className={labelClass}>Fill</Label>
            <Input
              className={controlClass}
              type="color"
              value={element.fill}
              onChange={(event) => onUpdateElement(element.id, { fill: event.target.value })}
            />
          </div>
        </InspectorSection>
      )}
      {element.type === "image" && (
        <InspectorSection title="Image" icon={ImageIcon}>
          <div className="space-y-1">
            <Label className={labelClass}>Image Source</Label>
            <textarea
              className={`${controlClass} min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm leading-5`}
              value={imageSourceUrl(element)}
              readOnly
              aria-label="Image Source"
            />
          </div>
        </InspectorSection>
      )}
    </div>
  )
}
