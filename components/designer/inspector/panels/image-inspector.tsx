"use client"

import { ImageIcon, Replace } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import { ToggleGroupField } from "@/components/designer/inspector/fields/toggle-group-field"
import { ImageCropDialog } from "@/components/designer/inspector/panels/image-crop-dialog"
import { imageSourceUrl } from "@/components/designer/image-source-url"
import { controlClass, labelClass } from "@/components/designer/inspector/inspector-styles"
import type { ImageDesignElement } from "@/types/designer"

export function ImageInspector({
  element,
  onUpdate,
  onReplace,
}: {
  element: ImageDesignElement
  onUpdate: (updates: Partial<ImageDesignElement>) => void
  onReplace: () => void
}) {
  const isPlaceholder = element.src.startsWith("placeholder:")
  return (
    <InspectorSection title="Image" icon={ImageIcon}>
      <ToggleGroupField
        label="Fit"
        value={element.fit ?? "contain"}
        options={[
          { value: "cover", label: "Cover" },
          { value: "contain", label: "Contain" },
        ]}
        onChange={(v) => onUpdate({ fit: v as "cover" | "contain" })}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full bg-transparent"
        onClick={onReplace}
      >
        <Replace className="mr-2 h-4 w-4" />
        Replace image
      </Button>
      {!isPlaceholder && (
        <ImageCropDialog src={element.src} onCropped={(dataUrl) => onUpdate({ src: dataUrl })} />
      )}
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
  )
}
