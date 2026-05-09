"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface QrRendererProps {
  value: string
  foreground: string
  background: string
  alt: string
}

export function QrRenderer({ value, foreground, background, alt }: QrRendererProps) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    let active = true
    QRCode.toDataURL(value || " ", {
      margin: 1,
      color: { dark: foreground, light: background },
      errorCorrectionLevel: "M",
    }).then((dataUrl) => {
      if (active) setSrc(dataUrl)
    })
    return () => {
      active = false
    }
  }, [background, foreground, value])

  if (!src) return <div className="h-full w-full bg-white" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="h-full w-full" />
}
