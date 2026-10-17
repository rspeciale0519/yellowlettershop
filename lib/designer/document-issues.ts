import type { DesignerDocument, DesignerPage } from '../../types/designer'
import { normalizeDesignerDocument } from './document/normalize'
import { getPrintedPages } from './document/pages'
import { runPreflight } from '../../components/designer/preflight/preflight-rules'
import { specRectsPx } from '../../components/designer/mail-spec'
import { extractTokens, resolveFieldKey } from '../../components/designer/tokens/token-engine'
import { elementStory } from './text/layout'
import { storyText } from './text/rich-text-schema'
import type { DocumentLayout, ResolvedValues } from './text/types'
export interface DocumentIssue { pageId: DesignerPage; elementId?: string; severity:'error'|'warning'; rule:string; message:string; action:string; recipientId?:string }
export interface DesignerPersonalizationContext { mode:'sample'|'actual'; values:ResolvedValues }
export function collectDocumentIssues(input:DesignerDocument,layout:DocumentLayout,assets:Record<string,{w:number;h:number}>={},context:DesignerPersonalizationContext={mode:'sample',values:{}}):DocumentIssue[]{
  const doc=normalizeDesignerDocument(input)
  const issues:DocumentIssue[]=layout.issues.map(issue=>({...issue,severity:'error',action:issue.rule==='overflow'?'Edit the message or add a supported page.':'Choose a supported print font or character.'}))
  for(const page of getPrintedPages(doc)){
    issues.push(...runPreflight(page.elements,{specRects:specRectsPx(doc.formatId ?? 'letter_8_5x11',doc.orientation),naturalSizes:assets}).map(issue=>({pageId:page.id,elementId:issue.elementId,severity:issue.rule==='placeholder' || issue.rule==='unknown-token'?'error' as const:issue.severity,rule:issue.rule,message:issue.message,action:'Select this object to fix it.'})))
    for(const element of page.elements){
      if(element.hidden || element.type!=='text' || element.continuesFrom) continue
      const text=storyText(elementStory(element))
      for(const token of extractTokens(text)){
        const key=resolveFieldKey(token)
        if(context.mode==='actual' && key!=='address_line_2' && !context.values[key]?.trim()) issues.push({pageId:page.id,elementId:element.id,severity:'error',rule:'missing-field',message:`${element.name}: ${token.replaceAll('_',' ')} has no value for this recipient.`,action:'Provide this detail or remove the field.'})
      }
    }
  }
  return issues
}
