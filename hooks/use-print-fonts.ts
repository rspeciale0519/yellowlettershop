"use client"
import { useEffect, useState } from 'react'
import { createFontMetrics } from '@/lib/designer/text/font-metrics'
import { PRINT_FONT_KEYS, PRINT_FAMILIES } from '@/lib/designer/text/font-manifest'
import type { FontMetrics } from '@/lib/designer/text/types'
let pending: Promise<FontMetrics> | undefined
let ready: FontMetrics | undefined
export function loadBrowserPrintFonts(): Promise<FontMetrics> {
  pending ??= Promise.all(PRINT_FONT_KEYS.map(async key => {
    const response = await fetch(`/fonts/print/${key}.ttf`)
    if (!response.ok) throw new Error('Printable fonts could not load. Retry before continuing.')
    const buffer = await response.arrayBuffer()
    const family = key.split('-')[0] as keyof typeof PRINT_FAMILIES
    const face = new FontFace(PRINT_FAMILIES[family], buffer, { weight: key.includes('bold') ? '700' : '400', style: key.includes('italic') ? 'italic' : 'normal' })
    await face.load()
    document.fonts.add(face)
    return [key, new Uint8Array(buffer)] as const
  })).then(entries => { ready = createFontMetrics(Object.fromEntries(entries)); return ready }).catch(error => { pending = undefined; throw error })
  return pending
}
export function usePrintFonts() {
  const [metrics, setMetrics] = useState<FontMetrics | undefined>(ready)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void loadBrowserPrintFonts().then(value => { if (active) setMetrics(value) }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Printable fonts unavailable') }); return () => { active = false } }, [])
  return { metrics, error }
}
