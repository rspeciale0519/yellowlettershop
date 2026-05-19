"use client"

import { Move } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type DesignerFont } from "@/components/designer/designer-fonts"
import { InspectorHeader, InspectorSection } from "@/components/designer/inspector/inspector-section"
import { controlClass, labelClass } from "@/components/designer/inspector/inspector-styles"
import { TransformSection } from "@/components/designer/inspector/sections/transform-section"
import { TextInspector } from "@/components/designer/inspector/panels/text-inspector"
import { ImageInspector } from "@/components/designer/inspector/panels/image-inspector"
import { GraphicInspector } from "@/components/designer/inspector/panels/graphic-inspector"
import { QrInspector } from "@/components/designer/inspector/panels/qr-inspector"
import { TableInspector } from "@/components/designer/inspector/panels/table-inspector"
import type { CanvasSize, DesignElement } from "@/types/designer"

interface InspectorPanelProps {
  element: DesignElement | null
  fonts: DesignerFont[]
  canvasSize: CanvasSize
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void
  onReplaceImageRequest?: (id: string) => void
}

export function InspectorPanel({
  element,
  fonts,
  canvasSize,
  onUpdateElement,
  onReplaceImageRequest = () => undefined,
}: InspectorPanelProps) {
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
      <InspectorHeader subtitle="Edit the selected module" badge={element.type} />
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
        <TextInspector
          element={element}
          fonts={fonts}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
        />
      )}
      {element.type === "image" && (
        <ImageInspector
          element={element}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
          onReplace={() => onReplaceImageRequest(element.id)}
        />
      )}
      {element.type === "graphic" && (
        <GraphicInspector
          element={element}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
        />
      )}
      {element.type === "qr" && (
        <QrInspector
          element={element}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
        />
      )}
      {element.type === "table" && (
        <TableInspector
          element={element}
          onUpdate={(updates) => onUpdateElement(element.id, updates)}
        />
      )}

      <TransformSection
        element={element}
        canvasSize={canvasSize}
        onUpdate={(updates) => onUpdateElement(element.id, updates)}
      />
    </div>
  )
}
