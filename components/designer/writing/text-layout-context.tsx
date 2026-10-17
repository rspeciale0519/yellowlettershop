"use client"
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { usePrintFonts } from '@/hooks/use-print-fonts'
import { layoutDesignerDocument } from '@/lib/designer/text/layout'
import { SAMPLE_VALUES } from '@/lib/designer/text/resolve-values'
import type { DocumentLayout, ResolvedValues } from '@/lib/designer/text/types'
import type { RecipientDTO } from '@/components/designer/preview/recipient-dto'
import { buildTokenContext, type SenderInput } from '@/components/designer/tokens/recipient-map'
import type { DesignerDocument, DesignerPage } from '@/types/designer'
interface LayoutContext { document: DesignerDocument; pageId: DesignerPage; layout?: DocumentLayout; error: string | null; values: ResolvedValues; mode: 'sample'|'actual'; recipient:RecipientDTO|null; sender:SenderInput; setRecipient:(recipient:RecipientDTO|null)=>void; onFocusIssue?:(page:DesignerPage,id?:string)=>void }
const TextLayoutContext = createContext<LayoutContext | null>(null)
export function DesignerTextProvider({ document, pageId, values: suppliedValues, sender = {}, onFocusIssue, children }: { document: DesignerDocument; pageId: DesignerPage; values?: ResolvedValues; sender?:SenderInput; onFocusIssue?:(page:DesignerPage,id?:string)=>void; children: ReactNode }) {
  const [recipient,setRecipient] = useState<RecipientDTO|null>(null)
  const values = useMemo(() => suppliedValues ?? (recipient ? buildTokenContext(recipient,sender).values : {...SAMPLE_VALUES,...Object.fromEntries(Object.entries(buildTokenContext({id:'',firstName:'',lastName:'',addressLine1:'',addressLine2:'',city:'',state:'',zipCode:'',company:'',email:'',phone:''},sender).values).filter(([key,value])=>key.startsWith('sender_') && value))}),[suppliedValues,recipient,sender])
  const { metrics, error } = usePrintFonts()
  const layout = useMemo(() => metrics ? layoutDesignerDocument(document, values, metrics) : undefined, [document, metrics, values])
  return <TextLayoutContext.Provider value={{ document, pageId, layout, error, values, mode:recipient?'actual':'sample', recipient, sender, setRecipient, onFocusIssue }}>{children}</TextLayoutContext.Provider>
}
export function useDesignerTextLayout() { return useContext(TextLayoutContext) }
