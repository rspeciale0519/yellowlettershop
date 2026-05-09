"use client"

import { useCallback, useEffect, useState } from "react"
import type { DesignerImageAsset } from "@/types/designer"

type ApiAsset = {
  id: string
  filename?: string
  original_filename?: string
  file_url?: string
  file_size?: number
  created_at?: string
}

const APP_ASSET_BASE_URL = (() => {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  return configuredUrl && !configuredUrl.includes("localhost") ? configuredUrl : "https://www.yellowlettershop.com"
})()

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string; context?: string }
    return body.context ? `${body.error ?? fallback} (${body.context})` : body.error ?? fallback
  } catch {
    return fallback
  }
}

function toDesignerImage(asset: ApiAsset): DesignerImageAsset | null {
  if (!asset.file_url) return null
  return {
    id: asset.id,
    name: asset.filename || asset.original_filename || "Saved image",
    url: asset.file_url,
    sourceUrl: `${APP_ASSET_BASE_URL}/assets/images/${encodeURIComponent(asset.id)}`,
    size: asset.file_size,
    createdAt: asset.created_at,
  }
}

export function useDesignerImages(isEnabled: boolean) {
  const [images, setImages] = useState<DesignerImageAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadImages = useCallback(async () => {
    if (!isEnabled) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/assets?category=image")
      if (!response.ok) throw new Error("Unable to load saved images")
      const assets = (await response.json()) as ApiAsset[]
      setImages(assets.map(toDesignerImage).filter((asset): asset is DesignerImageAsset => Boolean(asset)))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load saved images")
    } finally {
      setIsLoading(false)
    }
  }, [isEnabled])

  useEffect(() => {
    void loadImages()
  }, [loadImages])

  const uploadImage = useCallback(async (file: File, name: string) => {
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", name.trim())
      formData.append("category", "designer")
      const response = await fetch("/api/assets", { method: "POST", body: formData })
      if (!response.ok) throw new Error(await readApiError(response, "Unable to save image"))
      const asset = toDesignerImage((await response.json()) as ApiAsset)
      if (!asset) throw new Error("Uploaded image did not include a preview URL")
      setImages((current) => [asset, ...current.filter((image) => image.id !== asset.id)])
      return asset
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to save image")
      throw uploadError
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { images, isLoading, isUploading, error, loadImages, uploadImage }
}
