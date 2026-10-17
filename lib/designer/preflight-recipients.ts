import type { DesignerDocument } from '../../types/designer'
import { collectDocumentIssues, type DocumentIssue } from './document-issues'
import { layoutDesignerDocument } from './text/layout'
import type { FontMetrics, ResolvedValues } from './text/types'
/** Check the full production set in bounded batches; selecting a fitting first recipient is insufficient. */
export async function preflightRecipients(doc:DesignerDocument,recipients:{id:string;values:ResolvedValues}[],metrics:FontMetrics):Promise<DocumentIssue[]>{
  const issues:DocumentIssue[]=[]
  const contexts=recipients.length?recipients:[{id:'',values:{}}]
  for(let offset=0;offset<contexts.length;offset+=25){
    for(const recipient of contexts.slice(offset,offset+25)){
      const layout=layoutDesignerDocument(doc,recipient.values,metrics)
      const found=collectDocumentIssues(doc,layout,{}, {mode:'actual',values:recipient.values})
      issues.push(...found.map(issue=>({...issue,recipientId:recipient.id})))
    }
    await new Promise<void>(resolve=>setTimeout(resolve,0))
  }
  return issues
}
