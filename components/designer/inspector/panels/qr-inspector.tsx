"use client"

import { QrCode } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { ColorField } from "@/components/designer/inspector/fields/color-field"
import { controlClass, labelClass } from "@/components/designer/inspector/inspector-styles"
import type { QrDesignElement } from "@/types/designer"

export function QrInspector({
  element,
  onUpdate,
}: {
  element: QrDesignElement
  onUpdate: (updates: Partial<QrDesignElement>) => void
}) {
  return (
    <InspectorSection title="QR Code" icon={QrCode}>
      <div className="space-y-1">
        <Label className={labelClass}>QR Value</Label>
        <Input
          className={controlClass}
          value={element.value}
          onChange={(event) => onUpdate({ value: event.target.value })}
        />
      </div>
      <ColorField
        label="Foreground"
        value={element.foreground}
        onChange={(foreground) => onUpdate({ foreground: foreground ?? "#111827" })}
      />
      <ColorField
        label="Background"
        value={element.background}
        onChange={(background) => onUpdate({ background: background ?? "#ffffff" })}
      />
    </InspectorSection>
  )
}
