import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { renderDesignToPdf } from '@/app/api/design/preview/_render/pdf-renderer'
import { buildTokenContext } from '@/components/designer/tokens/recipient-map'
import { isMailFormatId, type MailFormatId } from '@/components/designer/mail-spec'
import { resolveProofInputs } from '@/lib/orders/proof-inputs'
import type { DesignElement, DesignerDocument } from '@/types/designer'

const ProofRequestSchema = z.object({
  orderState: z.record(z.unknown()),
})

// Accept both the modern DesignerDocument and the legacy { elements } shape.
function normalizeDoc(designState: unknown): DesignerDocument {
  const s = (designState ?? {}) as Record<string, unknown>
  if (s.pages) return s as unknown as DesignerDocument
  const elements = (Array.isArray(s.elements) ? s.elements : []) as DesignElement[]
  return {
    templateId: 'legacy',
    templateName: 'Legacy',
    orientation: 'portrait',
    pages: { front: elements, back: [] },
    updatedAt: new Date().toISOString(),
  } as unknown as DesignerDocument
}

/**
 * Generate the order proof PDF: the customer's design rendered print-accurate
 * (same pdf-lib engine as the designer preview) with the first recipient's
 * data merged in. Stored under the user's prefix; URL returned for the
 * Review & Approval step.
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { orderState } = ProofRequestSchema.parse(body)

    const inputs = resolveProofInputs(orderState)
    const doc = normalizeDoc(inputs.designState)

    const formatId: MailFormatId = isMailFormatId(inputs.formatId)
      ? inputs.formatId
      : 'letter_8_5x11'
    const orientation = doc.orientation ?? 'portrait'

    const ctx = buildTokenContext(inputs.recipient, inputs.sender)
    const bytes = await renderDesignToPdf(doc, ctx, formatId, orientation, {
      addCropMarks: true,
    })

    const proofId = crypto.randomUUID()
    const path = `${userId}/proofs/${proofId}.pdf`
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from('design-previews')
      .upload(path, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: pub } = supabase.storage.from('design-previews').getPublicUrl(path)

    return NextResponse.json({
      proofId,
      proofUrl: pub.publicUrl,
      formatId,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Order proof generation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proof generation failed' },
      { status: 500 }
    )
  }
})
