import { canvasSizePx } from '../../../components/designer/mail-spec'
import type { DesignerDocument, DesignerPage, TextDesignElement } from '../../../types/designer'
import { guidedBox } from '../text/paper'
import { normalizeDesignerDocument } from './normalize'
export function setGuidedWriting(input: DesignerDocument,page: DesignerPage,id: string,enabled: boolean) {
  const doc=normalizeDesignerDocument(input)
  const size=canvasSizePx(doc.formatId ?? 'letter_8_5x11',doc.orientation)
  return {...doc,pages:{...doc.pages,[page]:doc.pages[page].map(element=>element.id===id && element.type==='text' ? enabled ? guidedBox(element,doc.pageSettings[page].paper,size) : {...element,writingMode:'free' as const} : element)},updatedAt:new Date().toISOString()}
}
export function addPrintedSide(input: DesignerDocument,source: DesignerPage,newId: DesignerPage=`page-${crypto.randomUUID()}`) {
  const doc=normalizeDesignerDocument(input)
  if (doc.formatId?.startsWith('postcard_')) throw new Error('Postcards have two fixed sides. Choose a letter for additional pages.')
  if (doc.pageOrder.length>=100) throw new Error('This design has reached its page limit.')
  const pageId=doc.pageOrder.find(id=>!doc.pageSettings[id].printIncluded) ?? newId
  const index=doc.pageOrder.includes(pageId) ? doc.pageOrder.indexOf(pageId) : doc.pageOrder.length
  const sourceSettings=doc.pageSettings[source]
  const continuations=doc.pages[source].filter((element):element is TextDesignElement=>element.type==='text' && element.writingMode==='guided' && !element.hidden).map(element=>({ ...element,id:`${element.id}-${pageId}`,content:'',richText:undefined,continuesFrom:element.continuesFrom ?? `${source}:${element.id}` }))
  const existing=doc.pages[pageId] ?? []
  return {pageId,document:{...doc,pageOrder:doc.pageOrder.includes(pageId)?doc.pageOrder:[...doc.pageOrder,pageId],pages:{...doc.pages,[pageId]:existing.length?existing:continuations},pageSettings:{...doc.pageSettings,[pageId]:{...sourceSettings,regions:[],printIncluded:true,sheetIndex:Math.floor(index/2),side:index%2?'back' as const:'front' as const}},updatedAt:new Date().toISOString()}}
}
export function removePrintedSide(input: DesignerDocument,page: DesignerPage) {
  const doc=normalizeDesignerDocument(input)
  if (doc.formatId?.startsWith('postcard_')) throw new Error('Both postcard sides are included in the product.')
  if (page==='front') throw new Error('Keep the first printed side. Remove an additional side instead.')
  if (doc.pageOrder.filter(id=>doc.pageSettings[id].printIncluded).length<=1) throw new Error('Keep at least one printed side.')
  return {...doc,pageSettings:{...doc.pageSettings,[page]:{...doc.pageSettings[page],printIncluded:false}},updatedAt:new Date().toISOString()}
}
