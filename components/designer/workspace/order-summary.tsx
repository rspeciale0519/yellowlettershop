"use client"
import { useEffect, useRef, useState } from 'react'
import { getPrintedPages } from '@/lib/designer/document/pages'
import { normalizeDesignerDocument } from '@/lib/designer/document/normalize'
import { getAdditionalSideChargeCents } from '@/lib/orders/additional-side-pricing'
import type { DesignerDocument } from '@/types/designer'
import { asRecord } from '@/lib/orders/quote-inputs'
export function DesignerOrderSummary({documentState,orderState}:{documentState:DesignerDocument;orderState:Record<string,unknown>}){
 const initialQuantity=Number(asRecord(orderState.pricing).validatedQuantity ?? asRecord(orderState.addressValidation ?? orderState.accuzipValidation).deliverableRecords ?? asRecord(asRecord(orderState.dataAndMapping).listData ?? orderState.listData).totalRecords ?? 0)
 const [quantity,setQuantity]=useState(initialQuantity || 0)
 const [quote,setQuote]=useState<{totalPrice:number;additionalSideChargeCents?:number;baseKey:string}|null>(null)
 const [error,setError]=useState<string|null>(null)
 const sequence=useRef(0)
 const doc=normalizeDesignerDocument(documentState)
 const sides=getPrintedPages(doc).length
 const included=doc.formatId?.startsWith('postcard_')?2:1
 const safeQuantity=Number.isSafeInteger(quantity) && quantity>0?quantity:0
 const fee=safeQuantity?getAdditionalSideChargeCents(sides,included,safeQuantity):0
 const baseKey=JSON.stringify({quantity,format:documentState.formatId,options:orderState.mailingOptions ?? asRecord(orderState.campaignSettings).mailingOptions})
 const key=JSON.stringify({documentState,quantity,orderState})
 useEffect(()=>{
  const id=++sequence.current
  if(!safeQuantity) return
  const controller=new AbortController()
  const timer=setTimeout(()=>{
   const options=orderState.mailingOptions ?? asRecord(orderState.campaignSettings).mailingOptions ?? {serviceLevel:'full_service',mailPieceFormat:documentState.formatId,includePostage:true,postageType:'first_class_forever'}
   const design={designJson:documentState}
   const state={...orderState,design,designAndContent:{...asRecord(orderState.designAndContent),design},mailingOptions:options,addressValidation:undefined,accuzipValidation:undefined,listData:{totalRecords:safeQuantity}}
   void fetch('/api/orders/pricing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderState:state}),signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error ?? 'Order estimate is unavailable');if(id===sequence.current){setQuote({...body,baseKey});setError(null)}}).catch(cause=>{if(id===sequence.current && !controller.signal.aborted) setError(cause instanceof Error?cause.message:'Estimate unavailable')})
  },250)
  return()=>{clearTimeout(timer);controller.abort()}
  // key covers the full estimate inputs; quote results must not refetch themselves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key])
 const displayedTotal=quote?.baseKey===baseKey?quote.totalPrice-Number(quote.additionalSideChargeCents ?? 0)/100+fee/100:null
 return <div className="space-y-2 rounded border p-3 text-xs" aria-live="polite">
  <label className="block">Mail pieces<input aria-label="Mail pieces" type="number" min={1} step={1} value={quantity || ''} onChange={event=>setQuantity(Number(event.target.value))} className="mt-1 w-full rounded border bg-background p-2" placeholder="Enter quantity"/></label>
  <p>{sides} printed {sides===1?'side':'sides'} · {Math.max(0,sides-included)} additional (${(Math.max(0,sides-included)*.1).toFixed(2)} extra per piece)</p>
  <p>Additional sides: $0.10 × {Math.max(0,sides-included)} × {safeQuantity || 'pieces'} = <strong data-testid="additional-side-total">{safeQuantity || sides<=included?`$${(fee/100).toFixed(2)}`:'Enter quantity'}</strong></p>
  {displayedTotal!==null && <p>Estimated order total: <strong>${displayedTotal.toFixed(2)}</strong></p>}
  <p className="text-muted-foreground">{error ?? (safeQuantity?'Final price uses your validated mailing count and selected order options.':'Enter a quantity for an estimate. Each extra printed letter side adds $0.10 per piece.')}</p>
 </div>
}
