"use client"

import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Maximize2,
  type LucideIcon,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { NumberField } from "@/components/designer/inspector/fields/number-field"
import { SliderField } from "@/components/designer/inspector/fields/slider-field"
import { labelClass } from "@/components/designer/inspector/inspector-styles"
import { alignToPage, type AlignDirection } from "@/components/designer/canvas/alignment"
import type { CanvasSize, DesignElement } from "@/types/designer"

const ALIGN_BUTTONS: { dir: AlignDirection; Icon: LucideIcon; label: string }[] = [
  { dir: "left", Icon: AlignHorizontalJustifyStart, label: "Align left" },
  { dir: "center", Icon: AlignHorizontalJustifyCenter, label: "Center horizontally" },
  { dir: "right", Icon: AlignHorizontalJustifyEnd, label: "Align right" },
  { dir: "top", Icon: AlignVerticalJustifyStart, label: "Align top" },
  { dir: "middle", Icon: AlignVerticalJustifyCenter, label: "Center vertically" },
  { dir: "bottom", Icon: AlignVerticalJustifyEnd, label: "Align bottom" },
]

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
      <div className="space-y-1.5">
        <Label className={labelClass}>Align to page</Label>
        <div className="flex gap-1">
          {ALIGN_BUTTONS.map(({ dir, Icon, label }) => (
            <button
              key={dir}
              type="button"
              aria-label={label}
              title={label}
              className="flex h-8 flex-1 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:border-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
              onClick={() => onUpdate(alignToPage(element, canvasSize, dir))}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
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
