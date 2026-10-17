"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StaticPageRender } from '@/components/design-preview-3d/static-page-render'
import { DesignerTextProvider, useDesignerTextLayout } from '@/components/designer/writing/text-layout-context'
import { canvasSizePx } from '@/components/designer/mail-spec'
import { normalizeDesignerDocument } from '@/lib/designer/document/normalize'
import { addPrintedSide, removePrintedSide, setGuidedWriting } from '@/lib/designer/document/actions'
import type { DesignerDocument, DesignerOrientation, DesignerPage } from '@/types/designer'
import type { PaperType } from '@/types/designer-document'
interface PagesPanelProps { activePage:DesignerPage; onPageChange:(page:DesignerPage)=>void; orientation?:DesignerOrientation; documentState?:DesignerDocument; onDocumentChange?:(doc:DesignerDocument)=>void }
export function PagesPanel({activePage,onPageChange,documentState,onDocumentChange}:PagesPanelProps){
 const [error,setError]=useState<string|null>(null)
 const values=useDesignerTextLayout()?.values
 const doc=documentState?normalizeDesignerDocument(documentState):null
 const order=doc?.pageOrder ?? ['front','back'] as DesignerPage[]
 const size=canvasSizePx(doc?.formatId ?? 'letter_8_5x11',doc?.orientation ?? 'portrait')
 const scale=110/size.width
 const run=(action:()=>void)=>{try{action();setError(null)}catch(cause){setError(cause instanceof Error?cause.message:'Page change failed')}}
 return <div className="space-y-3">
  <h3 className="text-center text-sm font-semibold">Printed sides</h3>
  {doc && <label className="block text-xs">Paper
   <select aria-label="Paper type" className="mt-1 w-full rounded border bg-background p-2" value={doc.pageSettings[activePage]?.paper ?? 'plain'} onChange={event=>run(()=>{
    const paper=event.target.value as PaperType
    let next={...doc,pageSettings:{...doc.pageSettings,[activePage]:{...doc.pageSettings[activePage],paper}}}
    for(const element of next.pages[activePage]) if(element.type==='text' && element.writingMode==='guided') next=setGuidedWriting(next,activePage,element.id,true)
    onDocumentChange?.(next)
   })}><option value="plain">Plain</option><option value="white-notepad">White notepad</option><option value="yellow-notepad">Yellow notepad</option></select>
  </label>}
  {order.map((id,index)=><div key={id} className="space-y-1">
   <Button type="button" variant="ghost" aria-label={`${id==='front'?'Front':id==='back'?'Back':`Side ${index+1}`} ${doc?.pageSettings[id].printIncluded===false?'not printed':'printed'}`} className={`h-auto w-full flex-col gap-2 border-2 p-2 [&_svg]:!h-full [&_svg]:!w-full ${activePage===id?'border-yellow-500':'border-transparent'}`} onClick={()=>onPageChange(id)}>
    {doc?<div className="relative overflow-hidden bg-white shadow-sm" style={{width:110,height:size.height*scale}}><div className="absolute left-0 top-0 origin-top-left" style={{transform:`scale(${scale})`,width:size.width,height:size.height}}><DesignerTextProvider document={doc} pageId={id} values={values}><StaticPageRender elements={doc.pages[id]} background={doc.backgrounds?.[id]} formatId={doc.formatId ?? 'letter_8_5x11'} orientation={doc.orientation} fonts={[]}/></DesignerTextProvider></div></div>:<span>{id}</span>}
    <span className="text-xs">{id==='front'?'Front':id==='back'?'Back':`Side ${index+1}`}{doc?.pageSettings[id].printIncluded===false?' · not printed':''}</span>
   </Button>
   {doc && id!=='front' && doc.pageSettings[id].printIncluded && !doc.formatId?.startsWith('postcard_') && <Button type="button" variant="ghost" size="sm" className="w-full text-xs" aria-label={`Remove side ${index+1}`} onClick={()=>run(()=>{onDocumentChange?.(removePrintedSide(doc,id));onPageChange('front')})}>Remove side</Button>}
  </div>)}
  {doc && !doc.formatId?.startsWith('postcard_') && <Button type="button" variant="outline" className="w-full" onClick={()=>run(()=>{const result=addPrintedSide(doc,activePage);onDocumentChange?.(result.document);onPageChange(result.pageId)})}>Add Page</Button>}
  {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
 </div>
}
