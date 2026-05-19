"use client"

import { PaintBucket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssetPicker } from "@/components/designer/asset-picker"
import { ColorField } from "@/components/designer/inspector/fields/color-field"
import { ToggleGroupField } from "@/components/designer/inspector/fields/toggle-group-field"
import { SliderField } from "@/components/designer/inspector/fields/slider-field"
import { InspectorSection } from "@/components/designer/inspector/inspector-section"
import type { DesignerImageAsset, DesignerPage, PageBackground } from "@/types/designer"

export function BackgroundPanel({
  page,
  background,
  savedImages,
  imageLibraryError,
  isLoadingImages,
  isUploadingImage,
  onUploadImage,
  onChange,
}: {
  page: DesignerPage
  background?: PageBackground
  savedImages: DesignerImageAsset[]
  imageLibraryError: string | null
  isLoadingImages: boolean
  isUploadingImage: boolean
  onUploadImage: (file: File, name: string) => Promise<void>
  onChange: (next: PageBackground | undefined) => void
}) {
  const commit = (next: PageBackground) => {
    onChange(!next.color && !next.image ? undefined : next)
  }
  const image = background?.image

  return (
    <div className="space-y-4 bg-slate-900 p-4 text-slate-100">
      <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
        <h2 className="text-lg font-semibold text-white">Background</h2>
        <p className="mt-1 text-xs capitalize text-slate-400">Applies to the {page} of your mail piece.</p>
      </div>

      <InspectorSection title="Color" icon={PaintBucket}>
        <ColorField
          label="Background color"
          value={background?.color}
          allowClear
          onChange={(color) => commit({ ...background, color })}
        />
      </InspectorSection>

      <InspectorSection title="Full-bleed image" icon={PaintBucket}>
        {image && !image.src.startsWith("placeholder:") ? (
          <div className="space-y-3">
            <ToggleGroupField
              label="Fit"
              value={image.fit}
              options={[
                { value: "cover", label: "Cover" },
                { value: "contain", label: "Contain" },
              ]}
              onChange={(v) =>
                commit({ ...background, image: { ...image, fit: v as "cover" | "contain" } })
              }
            />
            <SliderField
              label="Opacity"
              value={image.opacity ?? 1}
              min={0}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(opacity) => commit({ ...background, image: { ...image, opacity } })}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full bg-transparent text-red-300"
              onClick={() => commit({ ...background, image: undefined })}
            >
              Remove background image
            </Button>
          </div>
        ) : (
          <p className="mb-2 text-xs leading-5 text-slate-400">
            Full-bleed images extend into the print bleed and may be trimmed at the edges.
          </p>
        )}
        <AssetPicker
          mode="background"
          savedImages={savedImages}
          imageLibraryError={imageLibraryError}
          isLoadingImages={isLoadingImages}
          isUploadingImage={isUploadingImage}
          onUploadImage={onUploadImage}
          onPick={(asset) =>
            commit({
              ...background,
              image: {
                assetId: asset.id,
                src: asset.url,
                sourceUrl: asset.sourceUrl,
                fit: image?.fit ?? "cover",
                opacity: image?.opacity ?? 1,
              },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}
