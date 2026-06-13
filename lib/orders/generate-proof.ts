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
    .select('id, user_id, status, order_state, status_history')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single()

  if (error || !order) return { ok: false, error: 'Order not found' }
  if (order.status !== 'submitted') {
    return { ok: false, error: `Cannot generate proof for order in status "${order.status}"` }
  }

  try {
    const { bytes } = await renderOrderStatePdf(order.order_state ?? {})

    const path = `${userId}/proofs/order-${orderId}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('design-previews')
      .upload(path, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: pub } = supabase.storage.from('design-previews').getPublicUrl(path)
    const history = Array.isArray(order.status_history) ? order.status_history : []

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'proof_ready',
        proof_url: pub.publicUrl,
        updated_at: new Date().toISOString(),
        status_history: [...history, { status: 'proof_ready', at: new Date().toISOString() }],
      })
      .eq('id', orderId)
      .eq('user_id', userId)
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
