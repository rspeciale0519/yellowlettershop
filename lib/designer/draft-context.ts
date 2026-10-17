import { normalizeDesignerDocument } from './document/normalize'
import { documentRevision } from './content-revision'
import type { DesignerDocumentV2 } from '../../types/designer-document'
import type { SaveDesignResult } from './save-result'

export interface DraftContext { userId: string; templateId: string; designId?: string; orderId?: string }
export interface DraftStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface RecoveredDraft { context: DraftContext; document: DesignerDocumentV2; savedAt: string }
export interface PendingDesignReference extends RecoveredDraft { designId: string; revision: string }

export function contextIdentity(context: DraftContext): string {
  return JSON.stringify([context.userId, context.templateId, context.designId ?? null, context.orderId ?? null])
}
export function draftKey(context: DraftContext): string { return `yls.designer.v2:draft:${encodeURIComponent(contextIdentity(context))}` }
export function pendingDesignKey(context: DraftContext): string { return `yls.designer.v2:pending:${encodeURIComponent(contextIdentity(context))}` }
/** A per-order pointer lets the order tab discover the precise user/template/design scope. */
export function orderDesignKey(userId: string, orderId?: string): string { return `yls.designer.v2:order:${encodeURIComponent(JSON.stringify([userId, orderId ?? null]))}` }

export function orderRecoveryKey(userId: string, orderId?: string): string { return `yls.designer.v2:recovery:${encodeURIComponent(JSON.stringify([userId, orderId ?? null]))}` }

export function writeDraft(storage: DraftStorage, context: DraftContext, input: unknown): boolean {
  try {
    if (!context.userId || !context.templateId) return false
    const document = normalizeDesignerDocument(input)
    if (document.templateId !== context.templateId) return false
    storage.setItem(draftKey(context), JSON.stringify({ context, document, savedAt: new Date().toISOString() }))
    storage.setItem(orderRecoveryKey(context.userId, context.orderId), JSON.stringify({ context }))
    return true
  } catch { return false }
}
export const preserveDraftBeforeReplace = writeDraft

export function readDraft(storage: DraftStorage, context: DraftContext): RecoveredDraft | null {
  try {
    const raw = storage.getItem(draftKey(context))
    if (!raw) return null
    const recovered = JSON.parse(raw) as RecoveredDraft
    if (contextIdentity(recovered.context) !== contextIdentity(context)) return null
    const document = normalizeDesignerDocument(recovered.document)
    if (document.templateId !== context.templateId) return null
    return { ...recovered, document }
  } catch { return null }
}

export async function writePendingDesign(storage: DraftStorage, context: DraftContext, result: SaveDesignResult, input: unknown, isCurrent: () => boolean = () => true): Promise<boolean> {
  if (!result.ok) return false
  try {
    const document = normalizeDesignerDocument(input)
    if (!context.userId || document.templateId !== context.templateId || !result.designId || result.revision !== await documentRevision(document)) return false
    if (!isCurrent()) return false
    const reference: PendingDesignReference = { context, document: { ...document, designId: result.designId }, designId: result.designId, revision: result.revision, savedAt: new Date().toISOString() }
    storage.setItem(pendingDesignKey(context), JSON.stringify(reference))
    storage.setItem(orderDesignKey(context.userId, context.orderId), JSON.stringify({ context }))
    return true
  } catch { return false }
}

export async function readPendingDesign(storage: DraftStorage, context: DraftContext, expectedRevision?: string): Promise<PendingDesignReference | null> {
  try {
    const raw = storage.getItem(pendingDesignKey(context))
    if (!raw) return null
    const reference = JSON.parse(raw) as PendingDesignReference
    if (contextIdentity(reference.context) !== contextIdentity(context) || !reference.designId || typeof reference.revision !== 'string') return null
    const document = normalizeDesignerDocument(reference.document)
    if (document.templateId !== context.templateId || reference.revision !== await documentRevision(document)) return null
    if (expectedRevision && reference.revision !== expectedRevision) return null
    const draft = readDraft(storage, context)
    if (draft && reference.revision !== await documentRevision(draft.document)) return null
    return { ...reference, document }
  } catch { return null }
}

export function readOrderContext(storage: DraftStorage, userId: string, orderId?: string): DraftContext | null {
  try {
    const raw = storage.getItem(orderDesignKey(userId, orderId))
    if (!raw) return null
    const { context } = JSON.parse(raw) as { context: DraftContext }
    return context.userId === userId && context.orderId === orderId ? context : null
  } catch { return null }
}

export function readOrderDraft(storage: DraftStorage, userId: string, orderId?: string): RecoveredDraft | null {
  try {
    const raw = storage.getItem(orderRecoveryKey(userId, orderId))
    if (!raw) return null
    const { context } = JSON.parse(raw) as { context: DraftContext }
    if (context.userId !== userId || context.orderId !== orderId) return null
    return readDraft(storage, context)
  } catch { return null }
}

export async function readOrderDesign(storage: DraftStorage, userId: string, orderId?: string): Promise<PendingDesignReference | null> {
  const context = readOrderContext(storage, userId, orderId)
  if (!context) return null
  const currentDraft = readOrderDraft(storage, userId, orderId)
  if (currentDraft && contextIdentity(currentDraft.context) !== contextIdentity(context)) return null
  return readPendingDesign(storage, context)
}
