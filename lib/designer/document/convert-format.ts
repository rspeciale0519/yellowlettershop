import { canvasSizePx, remapElements, specRectsPx, type MailFormatId } from '../../../components/designer/mail-spec'
import type { DesignElement, DesignerDocument, DesignerPage } from '../../../types/designer'
import type { DesignerDocumentV2 } from '../../../types/designer-document'
import { normalizeDesignerDocument } from './normalize'

export type FormatConversionResult =
  | { ok: true; document: DesignerDocumentV2; recoverySnapshot: DesignerDocument }
  | { ok: false; code: 'too-many-printed-sides' | 'extra-side-artwork'; error: string; pageIds: DesignerPage[] }

/** Pure conversion: callers timestamp/commit the result and retain its recovery snapshot. */
export function convertDesignerFormat(input: DesignerDocument, nextFormatId: MailFormatId): FormatConversionResult {
  const document = normalizeDesignerDocument(structuredClone(input))
  const postcard = nextFormatId.startsWith('postcard_')
  const extraPages = document.pageOrder.filter(id => id !== 'front' && id !== 'back')
  if (postcard) {
    const printed = document.pageOrder.filter(id => document.pageSettings[id].printIncluded)
    if (printed.length > 2) return {
      ok: false, code: 'too-many-printed-sides', pageIds: printed,
      error: 'Postcards have two fixed sides. Exclude or remove additional printed sides until at most two remain, or keep a letter format. Your original design is unchanged.',
    }
    const artwork = extraPages.filter(id => document.pages[id].length > 0 ||
      document.backgrounds?.[id]?.color || document.backgrounds?.[id]?.image || document.pageSettings[id].paper !== 'plain')
    if (artwork.length) return {
      ok: false, code: 'extra-side-artwork', pageIds: artwork,
      error: 'Additional sides contain artwork, hidden objects, backgrounds, or ruled paper. Move or clear that artwork from the additional sides before choosing a postcard, or keep a letter format. Your original design is unchanged.',
    }
  }

  const from = canvasSizePx(document.formatId ?? 'letter_8_5x11', document.orientation)
  const to = canvasSizePx(nextFormatId, document.orientation)
  const safe = specRectsPx(nextFormatId, document.orientation).safe
  const remapPage = (elements: DesignElement[]): DesignElement[] => {
    const remapped = remapElements(elements, from, to)
    if (from.width === to.width && from.height === to.height) return remapped
    return remapped.map((element, index) => element.type !== 'postage' ? element : {
      ...element,
      // Postage footprints are physical inches×100, not scalable artwork.
      width: elements[index].width,
      height: elements[index].height,
      x: Math.max(safe.x, Math.min(element.x, safe.x + safe.w - elements[index].width)),
      y: Math.max(safe.y, Math.min(element.y, safe.y + safe.h - elements[index].height)),
    })
  }
  const pageOrder: DesignerPage[] = postcard ? ['front', 'back'] : [...document.pageOrder]
  const pages = Object.fromEntries(pageOrder.map(id => [id, remapPage(document.pages[id])])) as DesignerDocumentV2['pages']
  const pageSettings = Object.fromEntries(pageOrder.map(id => {
    const settings = document.pageSettings[id]
    const regions = remapElements(settings.regions, from, to).map(region => ({
      ...region,
      ...(region.firstBaseline === undefined ? {} : { firstBaseline: region.firstBaseline * to.height / from.height }),
      ...(region.lineSpacing === undefined ? {} : { lineSpacing: region.lineSpacing * to.height / from.height }),
    }))
    return [id, { ...settings, regions, ...(postcard ? { printIncluded: true, sheetIndex: 0, side: id === 'front' ? 'front' as const : 'back' as const } : {}) }]
  }))
  const backgrounds = document.backgrounds ? Object.fromEntries(pageOrder.filter(id => document.backgrounds?.[id] !== undefined).map(id => [id, document.backgrounds![id]])) : undefined
  return {
    ok: true,
    document: { ...document, formatId: nextFormatId, pageOrder, pages, pageSettings, ...(backgrounds ? { backgrounds } : {}) },
    recoverySnapshot: structuredClone(input),
  }
}
