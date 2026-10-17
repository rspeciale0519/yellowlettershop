"use client"
import { useEffect, useState } from 'react'
import { createFontMetrics } from '@/lib/designer/text/font-metrics'
import { PRINT_FONT_KEYS, PRINT_FAMILIES } from '@/lib/designer/text/font-manifest'
import type { FontMetrics } from '@/lib/designer/text/types'
let pending: Promise<FontMetrics> | undefined
let ready: FontMetrics | undefined
let loadedBinaries: Record<string,Uint8Array> | undefined
const embeddedCss=new Map<string,string>()
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
  })).then(entries => { loadedBinaries=Object.fromEntries(entries);ready = createFontMetrics(loadedBinaries); return ready }).catch(error => { pending = undefined; throw error })
  return pending
}
/** foreignObject capture cannot inherit fonts loaded through the FontFace API. */
export async function browserPrintFontCSS(keys:Iterable<string>):Promise<string>{
  await loadBrowserPrintFonts()
  return [...new Set(keys)].map(key=>{
    if(!PRINT_FONT_KEYS.includes(key) || !loadedBinaries?.[key]) throw new Error('Printable capture fonts are unavailable.')
    if(!embeddedCss.has(key)){
      const bytes=loadedBinaries[key]
      const chunks:string[]=[]
      for(let at=0;at<bytes.length;at+=16384) chunks.push(String.fromCharCode(...bytes.subarray(at,at+16384)))
      const family=PRINT_FAMILIES[key.split('-')[0] as keyof typeof PRINT_FAMILIES]
      embeddedCss.set(key,`@font-face{font-family:"${family}";font-weight:${key.includes('bold')?700:400};font-style:${key.includes('italic')?'italic':'normal'};src:url("data:font/ttf;base64,${btoa(chunks.join(''))}") format("truetype");}`)
    }
    return embeddedCss.get(key)!
  }).join('\n')
}
export function usePrintFonts() {
  const [metrics, setMetrics] = useState<FontMetrics | undefined>(ready)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { let active = true; void loadBrowserPrintFonts().then(value => { if (active) setMetrics(value) }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Printable fonts unavailable') }); return () => { active = false } }, [])
  return { metrics, error }
}
