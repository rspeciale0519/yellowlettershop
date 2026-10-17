import { documentRevision } from './content-revision'
import { normalizeDesignerDocument } from './document/normalize'
import type { PendingDesignReference } from './draft-context'
import type { createClient } from '../../utils/supabase/client'

/** Local storage is a discovery hint. Confirm ownership and exact remote content. */
export async function verifySavedDesignReference(database: ReturnType<typeof createClient>, userId: string, reference: PendingDesignReference, orderId?: string) {
  if (reference.context.userId !== userId || reference.context.orderId !== orderId) return null
  return loadSavedDesign(database, userId, reference.designId, reference.revision)
}

export async function loadSavedDesign(database: ReturnType<typeof createClient>, userId: string, designId: string, expectedRevision: string) {
  const { data, error } = await database.from('saved_designs').select('id, design_data').eq('id', designId).eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  try {
    const document = normalizeDesignerDocument(data.design_data)
    if (await documentRevision(document) !== expectedRevision) return null
    return {
      designId: data.id as string, revision: expectedRevision, designRevision: expectedRevision,
      designJson: { ...document, designId: data.id as string }, templateId: document.templateId,
      variablesUsed: Array.from(new Set([...JSON.stringify(document).matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g)].map(match => match[1]))).sort(),
      isCustomDesign: true,
    }
  } catch { return null }
}
