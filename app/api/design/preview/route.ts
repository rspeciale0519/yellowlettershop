import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { renderDesignToPdf } from '@/app/api/design/preview/_render/pdf-renderer'
import { buildTokenContext, type SenderInput } from '@/components/designer/tokens/recipient-map'
import type { RecipientDTO } from '@/components/designer/preview/recipient-dto'
import { MAIL_FORMATS, canvasSizePx, isMailFormatId, DESIGN_PPI, type MailFormatId } from '@/components/designer/mail-spec'
import type { DesignElement, DesignerDocument } from '@/types/designer'

const RecipientSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().optional(), lastName: z.string().optional(),
  addressLine1: z.string().optional(), addressLine2: z.string().optional(),
  city: z.string().optional(), state: z.string().optional(), zipCode: z.string().optional(),
  company: z.string().optional(), email: z.string().optional(), phone: z.string().optional(),
})

const PreviewRequestSchema = z.object({
  designState: z.any(),
  formatId: z.string().optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  recipient: RecipientSchema.optional(),
  sender: z.record(z.string()).optional(),
  // legacy checkout shape
  contactCard: z.any().optional(),
  sampleData: z.record(z.unknown()).optional(),
  addCropMarks: z.boolean().optional(),
})

function emptyRecipient(): RecipientDTO {
  return { id: '', firstName: '', lastName: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', company: '', email: '', phone: '' }
}

// Accept both the modern DesignerDocument and the legacy { elements } shape.
function normalizeDoc(designState: unknown): DesignerDocument {
  const s = (designState ?? {}) as Record<string, unknown>
  if (s.pages) return s as unknown as DesignerDocument
  const elements = (Array.isArray(s.elements) ? s.elements : []) as DesignElement[]
  return {
    templateId: 'legacy', templateName: 'Legacy', orientation: 'portrait',
    pages: { front: elements, back: [] }, updatedAt: new Date().toISOString(),
  } as unknown as DesignerDocument
}

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const data = PreviewRequestSchema.parse(body)
    const doc = normalizeDoc(data.designState)

    const formatId: MailFormatId = isMailFormatId(data.formatId)
      ? data.formatId
      : isMailFormatId((doc as { formatId?: string }).formatId)
        ? ((doc as { formatId: string }).formatId as MailFormatId)
        : 'letter_8_5x11'
    const orientation = data.orientation ?? doc.orientation ?? 'portrait'

    const recipient: RecipientDTO = { ...emptyRecipient(), ...(data.recipient ?? {}) }
    const sender: SenderInput = (data.sender ?? {}) as SenderInput
    const ctx = buildTokenContext(recipient, sender)

    const bytes = await renderDesignToPdf(doc, ctx, formatId, orientation, {
      addCropMarks: data.addCropMarks !== false,
    })

    const previewId = crypto.randomUUID()
    const path = `${userId}/${previewId}.pdf`
    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from('design-previews')
      .upload(path, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: pub } = supabase.storage.from('design-previews').getPublicUrl(path)

    const trim = canvasSizePx(formatId, orientation)
    const bleedIn = MAIL_FORMATS[formatId].bleedIn

    return NextResponse.json({
      previewId,
      pdfUrl: pub.publicUrl,
      pageCount: 2,
      widthIn: trim.width / DESIGN_PPI + 2 * bleedIn,
      heightIn: trim.height / DESIGN_PPI + 2 * bleedIn,
      dpi: 300,
      colorSpace: 'rgb',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Design preview generation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview generation failed' },
      { status: 500 },
    )
  }
})
