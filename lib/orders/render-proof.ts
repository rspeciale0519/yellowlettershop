import 'server-only'
import { renderDesignToPdf } from '@/app/api/design/preview/_render/pdf-renderer'
import { buildTokenContext } from '@/components/designer/tokens/recipient-map'
import { isMailFormatId, type MailFormatId } from '@/components/designer/mail-spec'
import { resolveProofInputs } from '@/lib/orders/proof-inputs'
import { normalizeDesignerDocument } from '@/lib/designer/document/normalize'

/**
 * Render an order's proof PDF from its raw order_state blob: the customer's
 * design, print-accurate with crop marks, merged with the first recipient.
 * Shared by the wizard's pre-submit proof and the post-submit order proof.
 */
export async function renderOrderStatePdf(
  orderState: Record<string, unknown>
): Promise<{ bytes: Uint8Array; formatId: MailFormatId }> {
  const inputs = resolveProofInputs(orderState)
  const doc = normalizeDesignerDocument(inputs.designState)
  const formatId: MailFormatId = isMailFormatId(inputs.formatId) ? inputs.formatId : 'letter_8_5x11'
  const orientation = doc.orientation ?? 'portrait'
  const ctx = buildTokenContext(inputs.recipient, inputs.sender)
  const bytes = await renderDesignToPdf(doc, ctx, formatId, orientation, { addCropMarks: true })
  return { bytes, formatId }
}
