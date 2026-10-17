"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DesignerDocument } from '@/types/designer'
import { canonicalDocumentContent, createDesignerSaveController, type SaveDesignResult } from '@/lib/designer/save-result'
import { contextIdentity, preserveDraftBeforeReplace, writeDraft, type DraftContext, type DraftStorage } from '@/lib/designer/draft-context'

export type DesignerSaveStatus = 'dirty' | 'saving' | 'saved' | 'local' | 'error'
export interface UseDesignerSaveArgs {
  document: DesignerDocument
  userId: string | null | undefined
  orderId?: string
  context?: { designId?: string; templateId?: string }
  /** Keep disabled until scoped recovery/server hydration finishes. */
  enabled?: boolean
  storage?: DraftStorage
}

async function persistDesign(snapshot: { document: DesignerDocument; context: DraftContext }, designId: string | undefined): Promise<SaveDesignResult> {
  const response = await fetch('/api/design/save', {
    method: designId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ designId, designState: snapshot.document, orderId: snapshot.context.orderId, templateId: snapshot.context.templateId }),
  })
  const payload = await response.json()
  if (!response.ok || payload.ok !== true || typeof payload.designId !== 'string' || typeof payload.revision !== 'string') {
    return { ok: false, recoverySaved: false, message: payload.message || payload.error || 'Unable to save. Retry saving your design.' }
  }
  return { ok: true, designId: payload.designId, revision: payload.revision }
}

export function useDesignerSave(args: UseDesignerSaveArgs) {
  const { document, userId, orderId, context, enabled = true } = args
  let storage = args.storage
  if (!storage && typeof window !== 'undefined') {
    try { storage = window.localStorage } catch { /* Browser storage can be disabled. */ }
  }
  const draftContext: DraftContext = { userId: userId ?? '', templateId: context?.templateId ?? document.templateId, designId: context?.designId ?? document.designId, orderId }
  const fingerprint = `${contextIdentity(draftContext)}:${canonicalDocumentContent(document)}`
  const latest = useRef({ document, context: draftContext, storage, enabled })
  latest.current = { document, context: draftContext, storage, enabled }
  const [state, setState] = useState<{ status: DesignerSaveStatus; message: string; fingerprint: string; result?: SaveDesignResult }>({ status: 'dirty', message: 'Unsaved changes', fingerprint })
  const requestId = useRef(0)
  const controller = useRef<ReturnType<typeof createDesignerSaveController> | null>(null)
  if (!controller.current) controller.current = createDesignerSaveController({
    getCurrent: () => ({ document: latest.current.document, context: latest.current.context, active: latest.current.enabled }),
    storage: {
      getItem: key => latest.current.storage?.getItem(key) ?? null,
      setItem: (key, value) => { if (!latest.current.storage) throw new Error('Local storage unavailable'); latest.current.storage.setItem(key, value) },
      removeItem: key => latest.current.storage?.removeItem(key),
    },
    persist: persistDesign,
  })

  useEffect(() => {
    if (!enabled || !userId) return
    const recovered = storage ? writeDraft(storage, draftContext, document) : false
    setState(previous => previous.fingerprint === fingerprint && (previous.status === 'saved' || previous.status === 'saving') ? previous : {
      status: recovered ? 'local' : 'dirty', fingerprint, message: recovered ? 'Saved on this device. Save online before continuing.' : 'Unsaved changes',
    })
    // fingerprint includes every content/context dependency without object-identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, enabled, userId, storage])

  const save = useCallback(async (): Promise<SaveDesignResult> => {
    if (!latest.current.enabled) return { ok: false, recoverySaved: false, message: 'Wait for your draft to finish loading.' }
    const id = ++requestId.current
    const initial = latest.current
    const startedFingerprint = `${contextIdentity(initial.context)}:${canonicalDocumentContent(initial.document)}`
    setState({ status: 'saving', message: 'Saving online…', fingerprint: startedFingerprint })
    const result = await controller.current!.save()
    if (id === requestId.current) setState({ status: result.ok ? 'saved' : result.recoverySaved ? 'local' : 'error', message: result.ok ? 'Saved online' : result.message, fingerprint: startedFingerprint, result })
    return result
  }, [])
  const preserveBeforeReplace = useCallback(() => {
    const current = latest.current
    return current.storage ? preserveDraftBeforeReplace(current.storage, current.context, current.document) : false
  }, [])
  const current = state.fingerprint === fingerprint
  return {
    save, retry: save, preserveBeforeReplace,
    status: current ? state.status : 'dirty' as DesignerSaveStatus,
    message: current ? state.message : 'Unsaved changes',
    savedReference: current && state.result?.ok ? state.result : null,
    draftContext,
  }
}
