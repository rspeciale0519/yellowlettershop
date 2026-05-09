"use client"

import { useEffect, useState } from "react"
import { DESIGNER_FONTS, type DesignerFont } from "@/components/designer/designer-fonts"

export function useDesignerFonts() {
  const [fonts, setFonts] = useState<DesignerFont[]>(DESIGNER_FONTS)

  useEffect(() => {
    let active = true
    fetch("/api/designer/fonts")
      .then((response) => response.json())
      .then((data: { fonts?: DesignerFont[] }) => {
        if (active && data.fonts?.length) setFonts(data.fonts)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  return fonts
}
