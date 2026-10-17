import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'
import { renderOrderStatePdf } from '@/lib/orders/render-proof'
import { loadPricingConfig } from '@/lib/orders/pricing-config'
import { loadOrderQuote, QuoteError } from '@/lib/orders/server-quote'
import { PROOF_BUCKET, signProofUrl } from '@/lib/orders/proof-storage'

const ProofRequestSchema = z.object({
  orderState: z.record(z.unknown()),
  quoteRevision: z.string().min(1),
})

/**
 * Pre-submit proof for the order wizard's Review step: the customer's design
 * rendered print-accurate (same pdf-lib engine as the designer preview) with
 * the first recipient's data merged in.
 */
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const body = await req.json()
    const { orderState, quoteRevision } = ProofRequestSchema.parse(body)

    const supabase = createClient()
    const quote = await loadOrderQuote(supabase, userId, orderState, await loadPricingConfig(supabase))
    if (quoteRevision !== quote.pricing.quoteRevision) throw new QuoteError('The quote changed. Refresh the quote before reviewing the proof.', 409)
    const { bytes, formatId } = await renderOrderStatePdf(quote.snapshot)

    const proofId = crypto.randomUUID()
    const path = `${userId}/proofs/${proofId}.pdf`
    const { error: uploadError } = await supabase.storage
      .from(PROOF_BUCKET)
      .upload(path, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    // Private bucket → short-lived signed URL for the Review step to display.
    const proofUrl = await signProofUrl(supabase, path)

    return NextResponse.json({
      proofId,
      quoteRevision: quote.pricing.quoteRevision,
      proofUrl,
      formatId,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof QuoteError) return NextResponse.json({ error: error.message }, { status: error.status })
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
