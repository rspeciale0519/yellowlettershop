import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { renderOrderStatePdf } from '@/lib/orders/render-proof'

const ProofRequestSchema = z.object({
  orderState: z.record(z.unknown()),
})

/**
 * Pre-submit proof for the order wizard's Review step: the customer's design
 * rendered print-accurate (same pdf-lib engine as the designer preview) with
 * the first recipient's data merged in.
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { orderState } = ProofRequestSchema.parse(body)

    const { bytes, formatId } = await renderOrderStatePdf(orderState)

    const proofId = crypto.randomUUID()
    const path = `${userId}/proofs/${proofId}.pdf`
    const supabase = createClient()
    // Ensure the proofs bucket exists (idempotent). Without this, the first proof
    // in a fresh environment fails with "Bucket not found".
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.some((b) => b.name === 'design-previews')) {
        await supabase.storage.createBucket('design-previews', { public: true })
      }
    } catch {
      // Non-fatal: the upload below surfaces a clear error if creation truly failed.
    }
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
