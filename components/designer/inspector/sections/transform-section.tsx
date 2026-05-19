"use client"

import { Maximize2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { NumberField } from "@/components/designer/inspector/fields/number-field"
import { SliderField } from "@/components/designer/inspector/fields/slider-field"
import { labelClass } from "@/components/designer/inspector/inspector-styles"
import type { CanvasSize, DesignElement } from "@/types/designer"

// Single unified Transform block for ALL element types — replaces the two
// duplicated "Module Alignment" blocks in the old inspector.
export function TransformSection({
  element,
  canvasSize,
  onUpdate,
}: {
  element: DesignElement
  canvasSize: CanvasSize
  onUpdate: (updates: Partial<DesignElement>) => void
}) {
  return (
    <InspectorSection title="Transform" icon={Maximize2}>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
          onClick={() => onUpdate({ x: canvasSize.width / 2 - element.width / 2 })}
        >
          Center H
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
          onClick={() => onUpdate({ y: canvasSize.height / 2 - element.height / 2 })}
        >
          Center V
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x} onChange={(x) => onUpdate({ x })} />
        <NumberField label="Y" value={element.y} onChange={(y) => onUpdate({ y })} />
        <NumberField label="Width" value={element.width} onChange={(width) => onUpdate({ width })} />
        <NumberField label="Height" value={element.height} onChange={(height) => onUpdate({ height })} />
      </div>
      <SliderField
        label="Rotation"
        value={element.rotation ?? 0}
        min={0}
        max={360}
        step={1}
        format={(v) => `${v}°`}
        onChange={(rotation) => onUpdate({ rotation })}
      />
      <SliderField
        label="Opacity"
        value={element.opacity ?? 1}
        min={0}
        max={1}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(opacity) => onUpdate({ opacity })}
      />
      <div className="flex items-center justify-between">
        <Label className={labelClass}>Lock</Label>
        <Switch
          checked={Boolean(element.locked)}
          onCheckedChange={(locked) => onUpdate({ locked })}
        />
      </div>
    </InspectorSection>
  )
}
