import 'server-only'
import { createServiceClient } from '@/utils/supabase/service'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { trySendEmail } from '@/lib/email'
import { orderShippedEmail } from '@/lib/email/templates'
import { getUserEmail } from '@/lib/orders/generate-proof'
import { applyDispatchTransition, type DispatchTransition } from './dispatch-core'
import { latestDispatch } from './dispatch-service'

/**
 * Walking a dispatch forward: accepted → in_production → shipped → delivered.
 *
 * Split out of dispatch-service.ts for the 350-line rule. Kept whole because
 * the ordering here is load-bearing — the row update has to win its race before
 * anything customer-visible happens.
 */

const TIMESTAMP_FOR: Partial<Record<DispatchTransition, string>> = {
  accepted: 'accepted_at',
  shipped: 'shipped_at',
  delivered: 'delivered_at',
}

/**
 * Advance a dispatch. Advances the customer-facing order status when the
 * transition warrants it, and notifies the customer on ship.
 */
export async function updateDispatchStatus(opts: {
  orderId: string
  status: DispatchTransition
  /**
   * The admin who made the change, or null for a vendor callback. Null is not
   * a shortcut: `admin_audit_log.actor_id` is `NOT NULL REFERENCES
   * auth.users(id)`, so a synthetic id would fail the FK and be swallowed by
   * logAdminAction's try/catch — losing the trail on the one path with no
   * human behind it. Vendor-initiated changes are recorded in
   * `vendor_status_callbacks` instead, which is built for exactly that.
   */
  actorId: string | null
  trackingNumber?: string
  trackingCarrier?: string
}): Promise<{ orderStatus: string | null }> {
  const { orderId, status, actorId, trackingNumber, trackingCarrier } = opts
  const supabase = createServiceClient()

  const dispatch = await latestDispatch(orderId)
  if (!dispatch) throw new Error('Order has not been dispatched yet')

  const transition = applyDispatchTransition(dispatch.status as string, status)
  if (!transition.ok) throw new Error(transition.reason)

  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  const stamp = TIMESTAMP_FOR[status]
  if (stamp) update[stamp] = new Date().toISOString()
  if (trackingNumber !== undefined) update.tracking_number = trackingNumber
  if (trackingCarrier !== undefined) update.tracking_carrier = trackingCarrier

  // Compare-and-swap on the status we just read. Two admins (or a double-click
  // that beats the button's disabled state) can both pass the transition check
  // above; without this filter both UPDATEs succeed and the customer gets two
  // "your order shipped" emails. uq_order_dispatches_live cannot help here —
  // both writes target the same row id, so the index is never consulted.
  const { data: updated, error: updateError } = await supabase
    .from('order_dispatches')
    .update(update)
    .eq('id', dispatch.id as string)
    .eq('status', dispatch.status as string)
    .select('id')
  if (updateError) throw new Error(`Failed to update dispatch: ${updateError.message}`)
  if (!updated || updated.length === 0) {
    throw new Error('Dispatch was just updated by another request — refresh to see it')
  }

  if (transition.orderStatus) {
    // NOTE: `orders` has no updated_at column — it tracks lifecycle moments
    // individually (shipped_at / delivered_at / captured_at).
    const orderUpdate: Record<string, unknown> = { status: transition.orderStatus }
    if (status === 'shipped') {
      orderUpdate.shipped_at = new Date().toISOString()
      if (trackingNumber) {
        orderUpdate.tracking_numbers = trackingCarrier
          ? [{ carrier: trackingCarrier, number: trackingNumber }]
          : [{ number: trackingNumber }]
      }
    }
    if (status === 'delivered') orderUpdate.delivered_at = new Date().toISOString()

    const { error: orderError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', orderId)
    if (orderError) throw new Error(`Failed to advance order: ${orderError.message}`)
  }

  if (status === 'shipped') {
    const { data: order } = await supabase
      .from('orders')
      .select('created_by')
      .eq('id', orderId)
      .single()

    const ownerId = (order as { created_by?: string } | null)?.created_by
    if (ownerId) {
      const email = await getUserEmail(ownerId)
      await trySendEmail(
        email,
        orderShippedEmail({
          orderId,
          shortId: orderId.split('-')[0].toUpperCase(),
          trackingNumber: trackingNumber ?? (dispatch.tracking_number as string | null),
          trackingCarrier: trackingCarrier ?? (dispatch.tracking_carrier as string | null),
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010',
        })
      )
    }
  }

  if (actorId) {
    await logAdminAction({
      actorId,
      action: 'order_dispatch_status_changed',
      targetType: 'order',
      targetId: orderId,
      oldValue: { status: dispatch.status },
      newValue: { status, trackingNumber, trackingCarrier },
    })
  }

  return { orderStatus: transition.orderStatus }
}
