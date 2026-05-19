// Single source of truth for designer print geometry.
//
// Pure & self-contained (no imports) so it is identical for the canvas,
// preflight, and the server PDF renderer, and trivially unit-testable.
//
// Coordinate model: ONE design space = inches x DESIGN_PPI (100).
//   - on-screen scaling is the existing `zoom` (no separate display DPI)
//   - print = a pure x PRINT_SCALE (3) multiply -> 300 DPI
// USPS address/indicia zone sizes are documented APPROXIMATIONS isolated
// here; ops must validate against the current USPS DMM before production
// print (changing them is a one-line edit).

export type MailFormatId =
  | 'postcard_4x6'
  | 'postcard_6x9'
  | 'postcard_6x11'
  | 'letter_8_5x11'

export type MailOrientation = 'portrait' | 'landscape'

export interface CanvasSizePx {
  width: number
  height: number
}

export interface RectPx {
  x: number
  y: number
  w: number
  h: number
}

export interface SpecRects {
  trim: RectPx
  bleed: RectPx
  safe: RectPx
  address: RectPx
  indicia: RectPx
}

export interface MailFormat {
  id: MailFormatId
  label: string
  /** Portrait-natural physical size in inches (width <= height). */
  widthIn: number
  heightIn: number
  bleedIn: number
  safeIn: number
  isLetter: boolean
}

export const DESIGN_PPI = 100
export const PRINT_DPI = 300
export const PRINT_SCALE = PRINT_DPI / DESIGN_PPI // 3
/** The legacy fixed portrait artboard, used to remap built-in templates. */
export const LEGACY_CANVAS: CanvasSizePx = { width: 862, height: 1112 }

export const MAIL_FORMATS: Record<MailFormatId, MailFormat> = {
  postcard_4x6: {
    id: 'postcard_4x6',
    label: 'Postcard 4×6',
    widthIn: 4,
    heightIn: 6,
    bleedIn: 0.125,
    safeIn: 0.125,
    isLetter: false,
  },
  postcard_6x9: {
    id: 'postcard_6x9',
    label: 'Postcard 6×9',
    widthIn: 6,
    heightIn: 9,
    bleedIn: 0.125,
    safeIn: 0.125,
    isLetter: false,
  },
  postcard_6x11: {
    id: 'postcard_6x11',
    label: 'Postcard 6×11',
    widthIn: 6,
    heightIn: 11,
    bleedIn: 0.125,
    safeIn: 0.125,
    isLetter: false,
  },
  letter_8_5x11: {
    id: 'letter_8_5x11',
    label: 'Letter 8.5×11',
    widthIn: 8.5,
    heightIn: 11,
    bleedIn: 0.125,
    safeIn: 0.1875,
    isLetter: true,
  },
}

export const DEFAULT_MAIL_FORMAT: MailFormatId = 'postcard_6x9'
/** Docs saved before formats existed are letter-sized at the legacy scale. */
export const LEGACY_FALLBACK_FORMAT: MailFormatId = 'letter_8_5x11'

export function isMailFormatId(value: unknown): value is MailFormatId {
  return typeof value === 'string' && value in MAIL_FORMATS
}

function orientedInches(
  fmt: MailFormat,
  orientation: MailOrientation,
): { wIn: number; hIn: number } {
  return orientation === 'landscape'
    ? { wIn: fmt.heightIn, hIn: fmt.widthIn }
    : { wIn: fmt.widthIn, hIn: fmt.heightIn }
}

export function canvasSizePx(
  formatId: MailFormatId,
  orientation: MailOrientation,
): CanvasSizePx {
  const { wIn, hIn } = orientedInches(MAIL_FORMATS[formatId], orientation)
  return { width: wIn * DESIGN_PPI, height: hIn * DESIGN_PPI }
}

export function printSizePx(
  formatId: MailFormatId,
  orientation: MailOrientation,
): CanvasSizePx {
  const c = canvasSizePx(formatId, orientation)
  return { width: c.width * PRINT_SCALE, height: c.height * PRINT_SCALE }
}

function clampZone(
  preferredWIn: number,
  preferredHIn: number,
  trimWIn: number,
  trimHIn: number,
): { w: number; h: number } {
  const w = Math.max(0.5, Math.min(preferredWIn, trimWIn - 1)) * DESIGN_PPI
  const h = Math.max(0.5, Math.min(preferredHIn, trimHIn - 1)) * DESIGN_PPI
  return { w, h }
}

export function specRectsPx(
  formatId: MailFormatId,
  orientation: MailOrientation,
): SpecRects {
  const fmt = MAIL_FORMATS[formatId]
  const { wIn, hIn } = orientedInches(fmt, orientation)
  const W = wIn * DESIGN_PPI
  const H = hIn * DESIGN_PPI
  const bleed = fmt.bleedIn * DESIGN_PPI
  const safe = fmt.safeIn * DESIGN_PPI
  const margin = 0.25 * DESIGN_PPI

  const addr = clampZone(fmt.isLetter ? 4 : 3.75, fmt.isLetter ? 1.5 : 1.75, wIn, hIn)
  const ind = clampZone(1.5, 0.75, wIn, hIn)

  return {
    trim: { x: 0, y: 0, w: W, h: H },
    bleed: { x: -bleed, y: -bleed, w: W + bleed * 2, h: H + bleed * 2 },
    safe: { x: safe, y: safe, w: W - safe * 2, h: H - safe * 2 },
    address: { x: W - margin - addr.w, y: H - margin - addr.h, w: addr.w, h: addr.h },
    indicia: { x: W - margin - ind.w, y: margin, w: ind.w, h: ind.h },
  }
}

/**
 * Back-compat: ensure a document carries a valid `formatId`. Documents saved
 * before formats existed default to legacy letter — elements are NEVER
 * reflowed (no data loss); only the missing field is filled.
 */
export function withFormatId<T extends { formatId?: unknown }>(
  doc: T,
): T & { formatId: MailFormatId } {
  const current = (doc as { formatId?: unknown }).formatId
  return {
    ...doc,
    formatId: isMailFormatId(current) ? current : LEGACY_FALLBACK_FORMAT,
  }
}

/**
 * Proportionally remap element geometry from one canvas space to another.
 * Used once to migrate the built-in templates into the inches×100 space.
 */
export function remapElements<
  T extends { x: number; y: number; width: number; height: number },
>(elements: T[], from: CanvasSizePx, to: CanvasSizePx): T[] {
  const sx = to.width / from.width
  const sy = to.height / from.height
  if (sx === 1 && sy === 1) return elements
  return elements.map((el) => ({
    ...el,
    x: el.x * sx,
    y: el.y * sy,
    width: el.width * sx,
    height: el.height * sy,
  }))
}
