import fontkit from '@pdf-lib/fontkit'
import { fontFamilyKey, printFontKey, PRINT_FONT_FEATURES } from './font-manifest'
import type { FontMetrics } from './types'
interface ParsedFont {
  unitsPerEm: number
  ascent: number
  layout(text: string, features: Record<string,boolean>): { positions: { xAdvance: number; yOffset?: number }[]; glyphs: { bbox: { minY: number; maxY: number } }[] }
  hasGlyphForCodePoint(code: number): boolean
}
export function createFontMetrics(binaries: Record<string, Uint8Array>): FontMetrics {
  const fonts = Object.fromEntries(Object.entries(binaries).map(([key, bytes]) => [key, fontkit.create(bytes) as unknown as ParsedFont]))
  // Wrapping asks for the same word/line prefixes across canvas, checks and thumbnails.
  const widths = new Map<string, number>()
  const get = (style: Parameters<FontMetrics['measure']>[1]) => {
    const font = fonts[printFontKey(style)]
    if (!font) throw new Error('Printable fonts are not loaded. Retry before continuing.')
    return font
  }
  return {
    measure(text, style) {
      const key = `${printFontKey(style)}:${style.fontSize}:${style.letterSpacing ?? 0}:${text}`
      const cached = widths.get(key)
      if (cached !== undefined) return cached
      const font = get(style)
      const advance = font.layout(text,PRINT_FONT_FEATURES).positions.reduce((total, pos) => total + pos.xAdvance, 0)
      const graphemes = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)).length
      const width = advance / font.unitsPerEm * style.fontSize + Math.max(0, graphemes - 1) * (style.letterSpacing ?? 0)
      if (widths.size >= 10_000) widths.delete(widths.keys().next().value!)
      widths.set(key,width)
      return width
    },
    ascent(style, text) {
      const font = get(style)
      if (!text?.trim()) return style.fontSize * .8
      const shaped=font.layout(text,PRINT_FONT_FEATURES)
      return Math.max(0,...shaped.glyphs.map((glyph,index)=>glyph.bbox.maxY + (shaped.positions[index].yOffset ?? 0))) / font.unitsPerEm * style.fontSize
    },
    descent(style, text) {
      const font=get(style)
      if (!text?.trim()) return style.fontSize * .2
      const shaped=font.layout(text,PRINT_FONT_FEATURES)
      return Math.max(0,...shaped.glyphs.map((glyph,index)=>-glyph.bbox.minY - (shaped.positions[index].yOffset ?? 0))) / font.unitsPerEm * style.fontSize
    },
    supports(text, style) { return fontFamilyKey(style.fontFamily) !== null && !(fontFamilyKey(style.fontFamily) === 'handwriting' && style.italic) && Array.from(text).every(char => /\s/.test(char) || get(style).hasGlyphForCodePoint(char.codePointAt(0) ?? 0)) },
  }
}
