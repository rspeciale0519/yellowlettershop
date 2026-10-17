import type { TextStyle } from '../../../types/designer-document'
export const PRINT_FAMILIES = { sans: 'YLS Sans', serif: 'YLS Serif', mono: 'YLS Mono', handwriting: 'YLS Handwriting' } as const
export const PRINT_FONT_KEYS = ['sans', 'serif', 'mono'].flatMap(family => ['regular', 'bold', 'italic', 'bold-italic'].map(variant => `${family}-${variant}`)).concat(['handwriting-regular', 'handwriting-bold'])
export function fontFamilyKey(family?: string): keyof typeof PRINT_FAMILIES | null {
  if (!family || ['arial', 'sans', 'YLS Sans'].includes(family)) return 'sans'
  if (['georgia', 'times', 'serif', 'YLS Serif'].includes(family)) return 'serif'
  if (['courier', 'mono', 'YLS Mono'].includes(family)) return 'mono'
  if (['handwriting', 'YLS Handwriting'].includes(family)) return 'handwriting'
  return null
}
export function printFontKey(style: TextStyle): string {
  if (fontFamilyKey(style.fontFamily) === 'handwriting') return `handwriting-${style.bold ? 'bold' : 'regular'}`
  return `${fontFamilyKey(style.fontFamily) ?? 'sans'}-${style.bold && style.italic ? 'bold-italic' : style.bold ? 'bold' : style.italic ? 'italic' : 'regular'}`
}
export function printCssFamily(style: TextStyle): string { return PRINT_FAMILIES[fontFamilyKey(style.fontFamily) ?? 'sans'] }
