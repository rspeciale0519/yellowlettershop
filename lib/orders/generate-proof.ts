import 'server-only'
import { createClient } from '@/utils/supabase/service'
import { renderOrderStatePdf } from '@/lib/orders/render-proof'
import { trySendEmail } from '@/lib/email'
import { proofReadyEmail } from '@/lib/email/templates'

export interface ProofGenerationResult {
  ok: boolean
  proofUrl?: string
  error?: string
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/** Look up the account email for transactional sends. */
export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user?.email) return null
  return data.user.email
}

/**
 * Generate the official proof for a submitted order: render, store, flip the
 * order to proof_ready and notify the customer. Failure leaves the order in
 * its current status with the error reported to the caller — never silent.
 */
export async function generateProofForOrder(
  orderId: string,
  userId: string
): Promise<ProofGenerationResult> {
  const supabase = createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, created_by, status, metadata')
    .eq('id', orderId)
    .eq('created_by', userId)
    .single()

  if (error || !order) return { ok: false, error: 'Order not found' }
  if (order.status !== 'submitted') {
    return { ok: false, error: `Cannot generate proof for order in status "${order.status}"` }
  }

  try {
    const orderState = (order.metadata as { order_state?: Record<string, unknown> })?.order_state ?? {}
    const { bytes } = await renderOrderStatePdf(orderState)

    const path = `${userId}/proofs/order-${orderId}.pdf`
    // Ensure the proofs bucket exists (idempotent; "Bucket not found" otherwise).
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

    // proof_urls present → displayStatus derives 'proof_ready' (order_status
    // stays 'submitted' until the customer approves → 'processing').
    const { error: updateError } = await supabase
      .from('orders')
      .update({ proof_urls: [pub.publicUrl] })
      .eq('id', orderId)
      .eq('created_by', userId)
    if (updateError) throw new Error(updateError.message)

    const email = await getUserEmail(userId)
    await trySendEmail(
      email,
      proofReadyEmail({
        orderId,
        shortId: orderId.split('-')[0].toUpperCase(),
        appUrl: appUrl(),
      })
    )

    return { ok: true, proofUrl: pub.publicUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proof generation failed'
    console.error(`Proof generation failed for order ${orderId}:`, err)
    return { ok: false, error: message }
  }
}
