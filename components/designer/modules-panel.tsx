"use client"

import type { DesignerModule } from "@/components/designer/module-definitions"
import { DESIGNER_MODULES } from "@/components/designer/module-definitions"
import { setDragPayload } from "@/components/designer/dnd"
import { AssetPicker } from "@/components/designer/asset-picker"
import type { DesignerImageAsset, Tool } from "@/types/designer"

interface ModulesPanelProps {
  activeTool: Tool
  onSelectTool: (tool: Tool) => void
  onAddModule: (moduleId: string) => void
  savedImages: DesignerImageAsset[]
  imageLibraryError: string | null
  isLoadingImages: boolean
  isUploadingImage: boolean
  imagePickerMode: "insert" | "replace"
  onUploadImage: (file: File, name: string) => Promise<void>
  onInsertImage: (asset: DesignerImageAsset) => void
}

const toolFilters: { id: Tool; label: string; modules: string[] }[] = [
  { id: "text", label: "Text", modules: ["heading", "body"] },
  { id: "images", label: "Images", modules: ["image"] },
  { id: "graphics", label: "Graphics", modules: ["shape"] },
  { id: "qr-codes", label: "QR Codes", modules: ["qr"] },
  { id: "tables", label: "Tables", modules: ["table"] },
]

function ModuleCard({ item, onAddModule }: { item: DesignerModule; onAddModule: (moduleId: string) => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      className="flex w-full cursor-grab items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-left shadow-sm transition hover:border-yellow-400 hover:bg-yellow-400/10 active:cursor-grabbing"
      draggable
      onClick={() => onAddModule(item.id)}
      onDragStart={(event) => setDragPayload(event.dataTransfer, { kind: "module", moduleId: item.id })}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-yellow-400/15 text-yellow-300">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{item.label}</span>
        <span className="block text-xs leading-5 text-slate-400">
          {item.id === "image" ? "Choose saved or upload from device" : item.description}
        </span>
      </span>
    </button>
  )
}

export function ModulesPanel({
  activeTool,
  onSelectTool,
  onAddModule,
  savedImages,
  imageLibraryError,
  isLoadingImages,
  isUploadingImage,
  imagePickerMode,
  onUploadImage,
  onInsertImage,
}: ModulesPanelProps) {
  const activeFilter = toolFilters.find((tool) => tool.id === activeTool) ?? toolFilters[0]
  const visibleModules = DESIGNER_MODULES.filter((item) => activeFilter.modules.includes(item.id))

  return (
    <div className="space-y-4 bg-slate-900 p-4 text-slate-100">
      <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
        <h2 className="text-lg font-semibold text-white">Modules</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Click to add to the center, or drag onto the page.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {toolFilters.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              activeFilter.id === tool.id
                ? "border-yellow-400 bg-yellow-400 text-slate-950"
                : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-yellow-400 hover:text-yellow-200"
            }`}
            onClick={() => onSelectTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>
      {activeFilter.id !== "images" ? (
        <div className="space-y-2">
          {visibleModules.map((item) => (
            <ModuleCard key={item.id} item={item} onAddModule={onAddModule} />
          ))}
        </div>
      ) : (
        <AssetPicker
          mode={imagePickerMode}
          savedImages={savedImages}
          imageLibraryError={imageLibraryError}
          isLoadingImages={isLoadingImages}
          isUploadingImage={isUploadingImage}
          onUploadImage={onUploadImage}
          onPick={onInsertImage}
        />
      )}
    </div>
  )
}
