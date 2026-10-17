import { z } from 'zod'
import { normalizeDesignerDocument } from './document/normalize'
import { documentRevision } from './content-revision'
import type { createClient } from '../../utils/supabase/service'

type Database = ReturnType<typeof createClient>
const normalizedDocument = z.unknown().transform((value, ctx) => {
  try { return normalizeDesignerDocument(value) } catch {
    ctx.addIssue({ code: 'custom', message: 'Invalid or unsupported design document' })
    return z.NEVER
  }
})
const saveSchema = z.object({ designState: normalizedDocument, orderId: z.string().uuid().optional(), templateId: z.string().optional(), name: z.string().optional(), description: z.string().optional() })

function failed(status: number, message: string) { return { status, body: { ok: false as const, recoverySaved: false, message, error: message } } }
function variables(document: unknown): string[] { return Array.from(new Set([...JSON.stringify(document).matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g)].map(match => match[1]))).sort() }

/** Server-only persistence; every service-role access carries an ownership predicate. */
export async function saveDesignForUser(database: Database, userId: string, input: unknown, update = false) {
  const parsed = (update ? saveSchema.extend({ designId: z.string().uuid() }) : saveSchema).safeParse(input)
  if (!parsed.success) return failed(400, 'Invalid request data')
  const data = parsed.data
  const designId = 'designId' in data ? data.designId as string : undefined
  try {
    // Wizard order ids are order_drafts ids. Submitted orders use created_by.
    let draft: { id: string; order_state: Record<string, unknown>; updated_at?: string } | null = null
    let order: { id: string; metadata: Record<string, unknown> | null } | null = null
    if (data.orderId) {
      const draftResult = await database.from('order_drafts').select('id, order_state, updated_at').eq('id', data.orderId).eq('user_id', userId).maybeSingle()
      if (draftResult.error) return failed(500, 'Unable to verify the order draft. Retry saving.')
      draft = draftResult.data
      if (!draft) {
        const orderResult = await database.from('orders').select('id, metadata').eq('id', data.orderId).eq('created_by', userId).maybeSingle()
        if (orderResult.error) return failed(500, 'Unable to verify the order. Retry saving.')
        order = orderResult.data
        if (!order) return failed(404, 'Order not found or you do not have access to it.')
      }
    }
    const designData = { design_data: data.designState, name: data.name ?? data.designState.templateName, description: data.description ?? null, updated_at: new Date().toISOString() }
    const query = designId
      ? database.from('saved_designs').update(designData).eq('id', designId).eq('user_id', userId)
      : database.from('saved_designs').insert({ ...designData, user_id: userId, is_template: false })
    const saved = await query.select('id, design_data, created_at, updated_at').maybeSingle()
    if (saved.error) return failed(500, 'Failed to save design. Retry saving.')
    if (!saved.data) return failed(404, 'Design not found or you do not have access to it.')
    // Hash the returned persisted content, not an assumed successful request.
    const revision = await documentRevision(saved.data.design_data)
    if (revision !== await documentRevision(data.designState)) return failed(409, 'The design changed while saving. Retry the current version.')
    const design = { designId: saved.data.id, revision, designRevision: revision, designJson: { ...data.designState, designId: saved.data.id }, templateId: data.designState.templateId, variablesUsed: variables(data.designState), isCustomDesign: true }
    if (draft && data.orderId) {
      const prior = draft.order_state ?? {}
      const designAndContent = typeof prior.designAndContent === 'object' && prior.designAndContent !== null ? prior.designAndContent : {}
      let link = database.from('order_drafts').update({ order_state: { ...prior, orderId: data.orderId, design, designAndContent: { ...designAndContent, design } }, updated_at: new Date().toISOString() }).eq('id', data.orderId).eq('user_id', userId)
      if (draft.updated_at) link = link.eq('updated_at', draft.updated_at)
      const linked = await link.select('id').maybeSingle()
      if (linked.error || !linked.data) return failed(409, 'Design saved, but the order changed or could not be linked. Retry before continuing.')
    }
    if (order && data.orderId) {
      // orders has no design_id/updated_at. Keep the reference beside order metadata.
      const priorState = order.metadata?.order_state && typeof order.metadata.order_state === 'object' ? order.metadata.order_state as Record<string, unknown> : {}
      const priorDesignAndContent = priorState.designAndContent && typeof priorState.designAndContent === 'object' ? priorState.designAndContent : {}
      const metadata = { ...order.metadata, design, order_state: { ...priorState, design, designAndContent: { ...priorDesignAndContent, design } } }
      let link = database.from('orders').update({ metadata }).eq('id', data.orderId).eq('created_by', userId)
      link = order.metadata === null ? link.is('metadata', null) : link.eq('metadata', JSON.stringify(order.metadata))
      const linked = await link.select('id').maybeSingle()
      if (linked.error || !linked.data) return failed(409, 'Design saved, but the order changed or could not be linked. Retry before continuing.')
    }
    return { status: 200, body: { ok: true as const, designId: saved.data.id as string, revision, variablesUsed: design.variablesUsed, savedAt: saved.data.updated_at } }
  } catch {
    return failed(500, 'Design save failed. Retry saving before continuing.')
  }
}
