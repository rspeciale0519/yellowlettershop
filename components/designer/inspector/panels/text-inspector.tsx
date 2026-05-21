"use client"

import { AlignCenter, AlignLeft, AlignRight, Type } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { FontSizeField } from "@/components/designer/inspector/fields/font-size-field"
import { SelectField } from "@/components/designer/inspector/fields/select-field"
import { ColorField } from "@/components/designer/inspector/fields/color-field"
import { ToggleGroupField } from "@/components/designer/inspector/fields/toggle-group-field"
import { SliderField } from "@/components/designer/inspector/fields/slider-field"
import { MergeFieldsSection } from "@/components/designer/inspector/sections/merge-fields-section"
import { labelClass } from "@/components/designer/inspector/inspector-styles"
import type { DesignerFont } from "@/components/designer/designer-fonts"
import type { TextDesignElement } from "@/types/designer"

export function TextInspector({
  element,
  fonts,
  onUpdate,
}: {
  element: TextDesignElement
  fonts: DesignerFont[]
  onUpdate: (updates: Partial<TextDesignElement>) => void
}) {
  const isBold = element.fontWeight === "bold" || (typeof element.fontWeight === "number" && element.fontWeight >= 600)
  return (
    <>
      <InspectorSection title="Typography" icon={Type}>
        <div className="space-y-1">
          <Label className={labelClass}>Text</Label>
          <Input
            className="h-10 border-slate-700 bg-slate-950/70 text-white placeholder:text-slate-500 focus-visible:ring-yellow-400"
            value={element.content}
            onChange={(event) => onUpdate({ content: event.target.value })}
          />
        </div>
        <SelectField
          label="Font"
          value={element.fontFamily ?? "arial"}
          options={fonts.filter((f) => f.enabled).map((f) => ({ value: f.id, label: f.label }))}
          onChange={(fontFamily) => onUpdate({ fontFamily })}
        />
        <div className="grid grid-cols-2 gap-2">
          <FontSizeField value={element.fontSize} onChange={(fontSize) => onUpdate({ fontSize })} />
          <ColorField
            label="Color"
            value={element.color ?? "#111827"}
            onChange={(color) => onUpdate({ color: color ?? "#111827" })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ToggleGroupField
            label="Weight"
            value={isBold ? "bold" : "normal"}
            options={[
              { value: "normal", label: "Regular" },
              { value: "bold", label: "Bold" },
            ]}
            onChange={(v) => onUpdate({ fontWeight: v as "normal" | "bold" })}
          />
          <ToggleGroupField
            label="Style"
            value={element.fontStyle ?? "normal"}
            options={[
              { value: "normal", label: "Normal" },
              { value: "italic", label: "Italic" },
            ]}
            onChange={(v) => onUpdate({ fontStyle: v as "normal" | "italic" })}
          />
        </div>
        <ToggleGroupField
          label="Decoration"
          value={element.textDecoration ?? "none"}
          options={[
            { value: "none", label: "None" },
            { value: "underline", label: "Underline" },
          ]}
          onChange={(v) => onUpdate({ textDecoration: v as "none" | "underline" })}
        />
      </InspectorSection>
      <InspectorSection title="Alignment & Spacing" icon={AlignCenter}>
        <ToggleGroupField
          label="Align"
          value={element.textAlign ?? "left"}
          options={[
            { value: "left", label: "Left", icon: AlignLeft },
            { value: "center", label: "Center", icon: AlignCenter },
            { value: "right", label: "Right", icon: AlignRight },
          ]}
          onChange={(v) => onUpdate({ textAlign: v as "left" | "center" | "right" })}
        />
        <SliderField
          label="Line height"
          value={element.lineHeight ?? 1.2}
          min={0.8}
          max={3}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(lineHeight) => onUpdate({ lineHeight })}
        />
        <SliderField
          label="Letter spacing"
          value={element.letterSpacing ?? 0}
          min={-2}
          max={20}
          step={0.5}
          format={(v) => `${v}px`}
          onChange={(letterSpacing) => onUpdate({ letterSpacing })}
        />
      </InspectorSection>
      <MergeFieldsSection
        onInsert={(token) => onUpdate({ content: `${element.content} ${token}` })}
      />
    </>
  )
}
