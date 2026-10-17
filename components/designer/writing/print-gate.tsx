"use client"
import { useEffect } from 'react'
import { useImageNaturalSizes } from "@/components/designer/preflight/use-image-natural-sizes"
import { collectDocumentIssues } from '@/lib/designer/document-issues'
import { useDesignerTextLayout } from './text-layout-context'
export interface PrintGateState { ready:boolean; error?:string }
export function DesignerPrintGate({onChange}:{onChange:(state:PrintGateState)=>void}){
 const context=useDesignerTextLayout()
 const assets=useImageNaturalSizes(context?Object.values(context.document.pages).flat():[])
 useEffect(()=>{
  if(!context?.layout){onChange({ready:false,error:context?.error ?? 'Printable text is still loading. Try again in a moment.'});return}
  const blocking=collectDocumentIssues(context.document,context.layout,assets, {mode:context.mode,values:context.values}).find(issue=>issue.severity==='error')
  onChange({ready:!blocking,error:blocking?.message})
 },[context?.document,context?.layout,context?.error,context?.mode,context?.values,assets,onChange])
 return null
}
