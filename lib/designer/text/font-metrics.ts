import fontkit from '@pdf-lib/fontkit'
import { fontFamilyKey, printFontKey } from './font-manifest'
import type { FontMetrics } from './types'
interface ParsedFont {
  unitsPerEm: number
  ascent: number
  layout(text: string): { positions: { xAdvance: number }[] }
  hasGlyphForCodePoint(code: number): boolean
}
export function createFontMetrics(binaries: Record<string, Uint8Array>): FontMetrics {
  const fonts = Object.fromEntries(Object.entries(binaries).map(([key, bytes]) => [key, fontkit.create(bytes) as unknown as ParsedFont]))
  const get = (style: Parameters<FontMetrics['measure']>[1]) => {
    const font = fonts[printFontKey(style)]
    if (!font) throw new Error('Printable fonts are not loaded. Retry before continuing.')
    return font
  }
  return {
    measure(text, style) {
      const font = get(style)
      const advance = font.layout(text).positions.reduce((total, pos) => total + pos.xAdvance, 0)
      return advance / font.unitsPerEm * style.fontSize + Math.max(0, Array.from(text).length - 1) * (style.letterSpacing ?? 0)
    },
    ascent(style) { const font = get(style); return font.ascent / font.unitsPerEm * style.fontSize },
    supports(text, style) { return fontFamilyKey(style.fontFamily) !== null && !(fontFamilyKey(style.fontFamily) === 'handwriting' && style.italic) && Array.from(text).every(char => /\s/.test(char) || get(style).hasGlyphForCodePoint(char.codePointAt(0) ?? 0)) },
  }
}
