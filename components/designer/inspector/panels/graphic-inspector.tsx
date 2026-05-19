"use client"

import { Droplet } from "lucide-react"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { ColorField } from "@/components/designer/inspector/fields/color-field"
import { ToggleGroupField } from "@/components/designer/inspector/fields/toggle-group-field"
import { SliderField } from "@/components/designer/inspector/fields/slider-field"
import type { GraphicDesignElement } from "@/types/designer"

export function GraphicInspector({
  element,
  onUpdate,
}: {
  element: GraphicDesignElement
  onUpdate: (updates: Partial<GraphicDesignElement>) => void
}) {
  return (
    <InspectorSection title="Graphic" icon={Droplet}>
      <ToggleGroupField
        label="Shape"
        value={element.shape}
        options={[
          { value: "rectangle", label: "Rect" },
          { value: "circle", label: "Circle" },
          { value: "line", label: "Line" },
          { value: "badge", label: "Badge" },
        ]}
        onChange={(v) => onUpdate({ shape: v as GraphicDesignElement["shape"] })}
      />
      <ColorField
        label="Fill"
        value={element.fill}
        onChange={(fill) => onUpdate({ fill: fill ?? "#000000" })}
      />
      <ColorField
        label="Stroke"
        value={element.stroke}
        allowClear
        onChange={(stroke) => onUpdate({ stroke })}
      />
      <SliderField
        label="Stroke width"
        value={element.strokeWidth ?? 0}
        min={0}
        max={24}
        step={1}
        format={(v) => `${v}px`}
        onChange={(strokeWidth) => onUpdate({ strokeWidth })}
      />
      <SliderField
        label="Corner radius"
        value={element.borderRadius ?? 0}
        min={0}
        max={200}
        step={1}
        format={(v) => `${v}px`}
        onChange={(borderRadius) => onUpdate({ borderRadius })}
      />
    </InspectorSection>
  )
}
