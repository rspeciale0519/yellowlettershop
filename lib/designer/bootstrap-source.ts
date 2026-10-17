import { normalizeDesignerDocument } from './document/normalize'
import { documentRevision } from './content-revision'
import { contextIdentity, pendingDesignKey, readDraft, readOrderDraft, type DraftContext, type DraftStorage, type RecoveredDraft } from './draft-context'
import type { DesignerDocument } from '../../types/designer'

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
/** Order-only links must use their owned workflow's design instead of resetting the canvas. */
export function orderBootstrapSource(state: unknown): { designId?: string; document?: DesignerDocument; templateId?: string } {
  if (!record(state)) throw new Error('The existing order has invalid workflow data. Its design has not been replaced.')
  if (state.designAndContent != null && !record(state.designAndContent)) throw new Error('The existing order has invalid design workflow data.')
  const nested = record(state.designAndContent) ? state.designAndContent.design : undefined
  const value = nested ?? state.design
  if (value == null) return {}
  if (!record(value)) throw new Error('The existing order has an invalid design reference. Its design has not been replaced.')
  let document = value.designJson == null ? undefined : normalizeDesignerDocument(value.designJson)
  if (value.designId != null && typeof value.designId !== 'string') throw new Error('The existing order has an invalid design id.')
  const candidate = value.designId || document?.designId
  if (candidate && typeof candidate !== 'string') throw new Error('The existing order has an invalid design id.')
  const designId = typeof candidate === 'string' && !candidate.startsWith('local-') ? candidate : undefined
  if (candidate && !designId && !document) throw new Error('The existing order has no recoverable design artwork.')
  if (!designId && document?.designId?.startsWith('local-')) document = { ...document, designId:undefined }
  return { designId, document, templateId: typeof value.templateId === 'string' ? value.templateId : undefined }
}

export interface BootstrapRecovery extends RecoveredDraft { savedDesignId?: string }
async function savedId(storage: DraftStorage, draft: RecoveredDraft): Promise<string | undefined> {
  if (draft.context.designId) return draft.context.designId
  if (draft.document.designId) return draft.document.designId
  try {
    const raw = storage.getItem(pendingDesignKey(draft.context))
    if (!raw) return undefined
    const reference = JSON.parse(raw)
    if (contextIdentity(reference.context) !== contextIdentity(draft.context) || typeof reference.designId !== 'string') return undefined
    if (reference.document?.designId !== reference.designId || await documentRevision(reference.document) !== reference.revision) return undefined
    return reference.designId
  } catch { return undefined }
}

/** A broad user/order recovery pointer must never overwrite a different explicit saved design. */
export async function readBootstrapRecovery(storage: DraftStorage, context: DraftContext, exactDesignId?: string): Promise<BootstrapRecovery | null> {
  const exact = readDraft(storage, { ...context, designId: exactDesignId })
  const candidates = [exact, readOrderDraft(storage, context.userId, context.orderId)]
  for (const draft of candidates) {
    if (!draft || (context.templateId && draft.document.templateId !== context.templateId)) continue
    const savedDesignId = await savedId(storage, draft)
    if (exactDesignId && savedDesignId !== exactDesignId) continue
    return { ...draft, savedDesignId }
  }
  return null
}
