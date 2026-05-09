"use client"

import { useMemo, useRef, useState } from "react"
import { CheckCircle2, ImageIcon, Loader2, UploadCloud } from "lucide-react"
import type { DesignerModule } from "@/components/designer/module-definitions"
import { DESIGNER_MODULES } from "@/components/designer/module-definitions"
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
      className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-left shadow-sm transition hover:border-yellow-400 hover:bg-yellow-400/10"
      draggable={item.id !== "image"}
      onClick={() => onAddModule(item.id)}
      onDragStart={(event) => {
        if (item.id === "image") return
        event.dataTransfer.setData("application/x-yls-module", item.id)
        event.dataTransfer.effectAllowed = "copy"
      }}
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imageName, setImageName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const normalizedName = imageName.trim().toLocaleLowerCase()
  const duplicateName = useMemo(
    () => savedImages.some((image) => image.name.trim().toLocaleLowerCase() === normalizedName),
    [normalizedName, savedImages],
  )
  const nameMessage = !imageName.trim()
    ? "Name required"
    : duplicateName
      ? "You already have an image with this name"
      : "Name available"
  const canUpload = Boolean(imageName.trim() && selectedFile && !duplicateName && !isUploadingImage)

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
      <div className="space-y-2">
        {visibleModules.map((item) => (
          <ModuleCard key={item.id} item={item} onAddModule={onAddModule} />
        ))}
      </div>
      {activeFilter.id === "images" && (
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {imagePickerMode === "replace" ? "Replace Image" : "Image Library"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {imagePickerMode === "replace"
                ? "Choose a saved image or upload a new one to swap the selected image."
                : "Choose a saved image or upload a new one to place on the page."}
            </p>
          </div>
          <div className="space-y-3 rounded-md border border-slate-700 bg-slate-900/80 p-3">
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Image name</span>
              <input
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                value={imageName}
                onChange={(event) => setImageName(event.target.value)}
                placeholder="Property logo"
              />
            </label>
            <div className={`flex items-center gap-1.5 text-xs ${duplicateName || !imageName.trim() ? "text-amber-200" : "text-emerald-300"}`}>
              {!duplicateName && imageName.trim() ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              <span>{nameMessage}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setSelectedFile(event.currentTarget.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-950/70 px-3 py-3 text-sm font-semibold text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              <ImageIcon className="h-4 w-4" />
              {selectedFile ? selectedFile.name : "Choose image file"}
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-3 text-sm font-bold text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              onClick={() => {
                if (!canUpload || !selectedFile) return
                void onUploadImage(selectedFile, imageName)
                  .then(() => {
                    setImageName("")
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  })
                  .catch(() => undefined)
              }}
              disabled={!canUpload}
            >
              {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {isUploadingImage ? "Saving to account..." : "Upload image"}
            </button>
          </div>
          {imageLibraryError && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {imageLibraryError}
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Saved Images</span>
              <span>{savedImages.length}</span>
            </div>
            {isLoadingImages && (
              <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-yellow-300" />
                Loading saved images
              </div>
            )}
            {!isLoadingImages && savedImages.length === 0 && (
              <div className="rounded-md border border-slate-700 bg-slate-900 p-3 text-sm text-slate-400">
                Upload a logo, photo, or artwork file to start your saved image library.
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {savedImages.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="group overflow-hidden rounded-lg border border-slate-700 bg-slate-900 text-left transition hover:border-yellow-400"
                  onClick={() => onInsertImage(asset)}
                >
                  <span className="block aspect-[4/3] bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-slate-200">
                    <ImageIcon className="h-3.5 w-3.5 text-yellow-300" />
                    <span className="truncate">{asset.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
