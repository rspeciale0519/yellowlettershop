"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { readOrderDraft } from '@/lib/designer/draft-context'
import { normalizeDesignerDocument } from '@/lib/designer/document/normalize'
import { orderBootstrapSource, readBootstrapRecovery } from '@/lib/designer/bootstrap-source'
import { bootstrapTemplateDocument, designerAuthenticationUrl, resolveTemplateEntry } from '@/lib/designer/template-entry'
import type { DesignerDocument } from '@/types/designer'

export function useDesignerBootstrap({supabase,query,hydrate}:{supabase:ReturnType<typeof createClient>;query:string;hydrate:(doc:DesignerDocument)=>void}) {
  const router = useRouter()
  const [user,setUser] = useState<User|null>(null)
  const [loading,setLoading] = useState(true)
  const [settledQuery,setSettledQuery] = useState<string|null>(null)
  const [error,setError] = useState<string|null>(null)
  const [hasDraft,setHasDraft] = useState(false)
  const [entryIssue,setEntryIssue] = useState<'unknown'|'preview-only'|null>(null)
  const [orderState,setOrderState] = useState<Record<string,unknown>>({})
  const [initialDesignId,setInitialDesignId] = useState<string|undefined>()
  const params = new URLSearchParams(query)
  const orderId = params.get('orderId') ?? undefined
  const requestedId = params.get('templateId')
  const designId = params.get('designId') ?? undefined
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setEntryIssue(null)
    setHasDraft(false)
    const run = async () => {
      try {
        const auth = await supabase.auth.getUser()
        if (cancelled) return
        if (auth.error || !auth.data.user) {
          setUser(null)
          router.replace(designerAuthenticationUrl(`?${query}`))
          return
        }
        const account = auth.data.user
        setUser(account)
        let state:Record<string,unknown> = {}
        if (orderId) {
          const response = await fetch(`/api/orders/drafts/${encodeURIComponent(orderId)}`)
          const body = await response.json()
          if (!response.ok) throw new Error(body.error ?? 'The existing order could not load. Your design has not been replaced.')
          orderBootstrapSource(body.orderState) // Missing/malformed workflow data is an error, never a new draft.
          state = body.orderState
        }
        const linked = orderBootstrapSource(state)
        const sourceId = designId ?? linked.designId
        let remote:DesignerDocument|null = linked.document ?? null
        if (sourceId) {
          const saved = await supabase.from('saved_designs').select('design_data').eq('id',sourceId).eq('user_id',account.id).single()
          if (saved.error || !saved.data) throw new Error('This saved design could not be opened for your account. Your recovery draft is preserved.')
          remote = normalizeDesignerDocument({...saved.data.design_data as Record<string,unknown>,designId:sourceId})
        }
        const selectionId = requestedId ?? (!remote ? linked.templateId ?? null : null)
        const entry = selectionId ? resolveTemplateEntry(selectionId) : null
        let recovered:Awaited<ReturnType<typeof readBootstrapRecovery>> = null
        try {
          setHasDraft(Boolean(readOrderDraft(localStorage,account.id,orderId)))
          const replacingTemplate = entry?.readiness==='ready' && remote && entry.designerTemplateId!==remote.templateId
          const recoveryId = designId ?? (replacingTemplate ? undefined : sourceId)
          recovered = await readBootstrapRecovery(localStorage, { userId:account.id, templateId:entry?.readiness==='ready' ? entry.designerTemplateId : remote?.templateId ?? '', orderId }, recoveryId)
        } catch { /* Blocked device storage does not prevent loading the owned remote design. */ }
        const initial = bootstrapTemplateDocument(selectionId,recovered?.document ?? remote)
        if (cancelled) return
        setOrderState(state)
        if (initial.status==='unavailable') { setEntryIssue(initial.reason); return }
        const savedScope = recovered ? recovered.savedDesignId : remote?.templateId === initial.document.templateId ? sourceId : undefined
        setInitialDesignId(savedScope)
        setEntryIssue(null)
        hydrate(normalizeDesignerDocument(initial.document))
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'The design could not be opened. Your recovery draft is preserved.')
      } finally {
        if (!cancelled) { setSettledQuery(query); setLoading(false) }
      }
    }
    void run()
    return () => { cancelled=true }
  },[supabase,router,hydrate,query,requestedId,orderId,designId])
  // Context changes render before effects run. Disable every writer synchronously in that render.
  return {user,loading:loading || settledQuery!==query,error,entryIssue,hasDraft,orderState,orderId,initialDesignId,setInitialDesignId}
}
