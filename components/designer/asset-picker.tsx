"use client"

import { useMemo, useRef, useState } from "react"
import { CheckCircle2, ImageIcon, Loader2, Search, UploadCloud } from "lucide-react"
import { setDragPayload } from "@/components/designer/dnd"
import { isDuplicateAssetName } from "@/components/designer/is-duplicate-asset-name"
import type { DesignerImageAsset } from "@/types/designer"

type AssetPickerMode = "insert" | "replace" | "background"

const COPY: Record<AssetPickerMode, { title: string; hint: string }> = {
  insert: {
    title: "Image Library",
    hint: "Choose a saved image or upload a new one to place on the page.",
  },
  replace: {
    title: "Replace Image",
    hint: "Choose a saved image or upload a new one to swap the selected image.",
  },
  background: {
    title: "Background Image",
    hint: "Choose a saved image or upload a full-bleed background.",
  },
}

export function AssetPicker({
  mode,
  savedImages,
  imageLibraryError,
  isLoadingImages,
  isUploadingImage,
  onUploadImage,
  onPick,
}: {
  mode: AssetPickerMode
  savedImages: DesignerImageAsset[]
  imageLibraryError: string | null
  isLoadingImages: boolean
  isUploadingImage: boolean
  onUploadImage: (file: File, name: string) => Promise<void>
  onPick: (asset: DesignerImageAsset) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imageName, setImageName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [search, setSearch] = useState("")
  const duplicateName = isDuplicateAssetName(imageName, savedImages)
  const nameMessage = !imageName.trim()
    ? "Name required"
    : duplicateName
      ? "You already have an image with this name"
      : "Name available"
  const canUpload = Boolean(imageName.trim() && selectedFile && !duplicateName && !isUploadingImage)

  const visibleImages = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? savedImages.filter((asset) => asset.name.toLowerCase().includes(q)) : savedImages
  }, [savedImages, search])

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{COPY[mode].title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{COPY[mode].hint}</p>
      </div>
      <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Image name</span>
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-400"
            value={imageName}
            onChange={(event) => setImageName(event.target.value)}
            placeholder="Property logo"
          />
        </label>
        <div className={`flex items-center gap-1.5 text-xs ${duplicateName || !imageName.trim() ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300"}`}>
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:border-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
        >
          <ImageIcon className="h-4 w-4" />
          {selectedFile ? selectedFile.name : "Choose image file"}
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
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
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {imageLibraryError}
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Saved Images</span>
          <span>{search.trim() ? `${visibleImages.length}/${savedImages.length}` : savedImages.length}</span>
        </div>
        {savedImages.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search images"
              aria-label="Search saved images"
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-yellow-400"
            />
          </div>
        )}
        {isLoadingImages && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500 dark:text-yellow-300" />
            Loading saved images
          </div>
        )}
        {!isLoadingImages && savedImages.length === 0 && (
          <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            Upload a logo, photo, or artwork file to start your saved image library.
          </div>
        )}
        {!isLoadingImages && savedImages.length > 0 && visibleImages.length === 0 && (
          <div className="rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
            No images match “{search.trim()}”.
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {visibleImages.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className="group cursor-grab overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-yellow-400 active:cursor-grabbing"
              draggable
              onDragStart={(event) => setDragPayload(event.dataTransfer, { kind: "asset", asset })}
              onClick={() => onPick(asset)}
            >
              <span className="block aspect-[4/3] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </span>
              <span className="flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-foreground">
                <ImageIcon className="h-3.5 w-3.5 text-yellow-500 dark:text-yellow-300" />
                <span className="truncate">{asset.name}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
