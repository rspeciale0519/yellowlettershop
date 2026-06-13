import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { renderOrderStatePdf } from '@/lib/orders/render-proof'
import { PROOF_BUCKET, signProofUrl } from '@/lib/orders/proof-storage'

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
    const { error: uploadError } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(path, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    // Private bucket → short-lived signed URL for the Review step to display.
    const proofUrl = await signProofUrl(supabase, path)

    return NextResponse.json({
      proofId,
      proofUrl,
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
