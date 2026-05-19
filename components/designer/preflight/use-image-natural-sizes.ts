"use client"

import { useEffect, useState } from "react"
import type { DesignElement } from "@/types/designer"

// Loads intrinsic pixel dimensions for image elements (for the low-DPI rule).
export function useImageNaturalSizes(elements: DesignElement[]) {
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({})

  const srcKey = elements
    .filter((el): el is Extract<DesignElement, { type: "image" }> => el.type === "image")
    .map((el) => `${el.id}:${el.src}`)
    .join("|")

  useEffect(() => {
    let cancelled = false
    const images = elements.filter(
      (el): el is Extract<DesignElement, { type: "image" }> =>
        el.type === "image" && !el.src.startsWith("placeholder:"),
    )
    images.forEach((el) => {
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        setSizes((prev) => ({ ...prev, [el.id]: { w: img.naturalWidth, h: img.naturalHeight } }))
      }
      img.src = el.src
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey])

  return sizes
}
