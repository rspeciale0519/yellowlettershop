import type { DesignerDocument, DesignerPage } from '../../../types/designer'
import type { DesignerDocumentV2, DesignPage } from '../../../types/designer-document'
import { normalizeDesignerDocument } from './normalize'
export function getDesignPage(input: DesignerDocument, pageId: DesignerPage): DesignPage | undefined {
  const doc = normalizeDesignerDocument(input)
  const settings = doc.pageSettings[pageId]
  return settings ? { ...settings, id: pageId, elements: doc.pages[pageId], background: doc.backgrounds?.[pageId] } : undefined
}
export function getPrintedPages(doc: DesignerDocumentV2 | DesignerDocument): DesignPage[] {
  const normalized = normalizeDesignerDocument(doc)
  return normalized.pageOrder.filter(id => normalized.pageSettings[id].printIncluded).map((id, index) => ({ ...normalized.pageSettings[id], sheetIndex: Math.floor(index / 2), side: index % 2 ? 'back' : 'front', id, elements: normalized.pages[id], background: normalized.backgrounds?.[id] }))
}
export function getDesignSpread(input: DesignerDocument, selectedPage: DesignerPage) {
  const pages = getPrintedPages(input)
  const sheet = pages.find(page => page.id === selectedPage)?.sheetIndex ?? 0
  return { sheetIndex: sheet, front: pages.find(page => page.sheetIndex === sheet && page.side === 'front'), back: pages.find(page => page.sheetIndex === sheet && page.side === 'back') }
}
