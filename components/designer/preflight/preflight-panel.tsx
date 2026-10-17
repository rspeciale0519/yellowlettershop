"use client"
import { runPreflight } from '@/components/designer/preflight/preflight-rules'
import { useImageNaturalSizes } from '@/components/designer/preflight/use-image-natural-sizes'
import { useDesignerTextLayout } from '@/components/designer/writing/text-layout-context'
import { collectDocumentIssues } from '@/lib/designer/document-issues'
import type { SpecRects } from '@/components/designer/mail-spec'
import type { CanvasSize, DesignElement, DesignerPage } from '@/types/designer'
interface PreflightPanelProps { elements:DesignElement[];canvasSize?:CanvasSize;specRects?:SpecRects;onSelectElement?:(id:string)=>void }
export function PreflightPanel({elements,specRects,onSelectElement}:PreflightPanelProps){
 const context=useDesignerTextLayout()
 const all=context?Object.values(context.document.pages).flat():elements
 const naturalSizes=useImageNaturalSizes(all)
 const issues=context?.layout?collectDocumentIssues(context.document,context.layout,naturalSizes,{mode:context.mode,values:context.values}):runPreflight(elements,{specRects,naturalSizes})
 return <div className="space-y-4 p-4">
  <h2 className="text-lg font-semibold">Print checks</h2><p className="text-xs text-muted-foreground">Checks all included printed sides and the selected preview details.</p>
  {context?.error && <p role="alert" className="text-red-600">{context.error}</p>}
  {context && !context.layout && !context.error?<p role="status">Preparing printable text…</p>:issues.length===0?<p role="status" className="rounded border border-green-500 p-3 text-sm">No issues found on included sides.</p>:issues.map((issue,index)=><button type="button" className={`block w-full rounded border p-3 text-left text-sm ${issue.severity==='error'?'border-red-500 text-red-600':'border-amber-500 text-amber-700'}`} key={index} onClick={()=>{if('pageId' in issue) context?.onFocusIssue?.(issue.pageId as DesignerPage,issue.elementId);else if(issue.elementId) onSelectElement?.(issue.elementId)}}>{'pageId' in issue?<span className="block text-xs">{String(issue.pageId)}</span>:null}{issue.message}</button>)}
 </div>
}
