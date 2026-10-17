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
  return normalized.pageOrder.filter(id => normalized.pageSettings[id].printIncluded).map(id => ({ ...normalized.pageSettings[id], id, elements: normalized.pages[id], background: normalized.backgrounds?.[id] }))
}
