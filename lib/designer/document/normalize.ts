import { documentSchema } from './schema'
import type { DesignerDocument, DesignerPage } from '../../../types/designer'
import type { DesignerDocumentV2, PageSettings } from '../../../types/designer-document'

/** Validate and upgrade without changing any artwork. Keep the input as a recovery snapshot before replacing it. */
export function normalizeDesignerDocument(input: unknown): DesignerDocumentV2 {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('This design is not a supported document. Keep the original and choose another draft.')
  const raw = input as Record<string, unknown>
  if (raw.version !== undefined && raw.version !== 2) throw new Error('This design version is not supported. Your original draft has been preserved.')
  const candidate = raw.pages ? raw : Array.isArray(raw.elements) ? {
    ...raw, templateId: 'legacy', templateName: 'Legacy design', orientation: raw.orientation ?? 'portrait',
    pages: { front: raw.elements, back: [] }, updatedAt: raw.updatedAt ?? new Date().toISOString(),
  } : raw
  const parsed = documentSchema.parse(candidate) as unknown as DesignerDocument
  if (!Array.isArray(parsed.pages.front) || !Array.isArray(parsed.pages.back)) throw new Error('The design is missing a page side. Recover the original draft.')
  const keys = Object.keys(parsed.pages) as DesignerPage[]
  const order = parsed.pageOrder ?? keys
  if (new Set(order).size !== order.length || keys.some(key => !order.includes(key)) || order.some(key => !Array.isArray(parsed.pages[key]))) throw new Error('The design page order is inconsistent.')
  const pageSettings: Record<string, PageSettings> = {}
  order.forEach((id, index) => {
    pageSettings[id] = parsed.pageSettings?.[id] ?? {
      printIncluded: id === 'front' || (id === 'back' && Boolean(parsed.formatId?.startsWith('postcard_'))) || parsed.pages[id].some(element => !element.hidden),
      sheetIndex: Math.floor(index / 2), side: index % 2 ? 'back' : 'front', paper: 'plain', regions: [],
    }
  })
  if (!order.some(id => pageSettings[id].printIncluded)) throw new Error('Include at least one printed side.')
  return { ...parsed, version: 2, formatId: parsed.formatId ?? 'letter_8_5x11', pageOrder: order, pageSettings }
}
