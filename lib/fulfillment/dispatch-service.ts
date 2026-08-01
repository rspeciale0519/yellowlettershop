import 'server-only'
import { createServiceClient } from '@/utils/supabase/service'
import { logAdminAction } from '@/lib/admin/audit-logger'
import { trySendEmail } from '@/lib/email'
import { vendorDispatchEmail, orderShippedEmail } from '@/lib/email/templates'
import { getUserEmail } from '@/lib/orders/generate-proof'
import { firstProofUrl } from '@/lib/orders/order-summary'
import { PROOF_BUCKET, signProofUrl } from '@/lib/orders/proof-storage'
import { findActivePrintVendor, getVendor, type VendorRecord } from '@/lib/vendors/vendor-directory'
import {
  canDispatch,
  buildRecipientCsv,
  vendorContactEmail,
  applyDispatchTransition,
  type DispatchableOrder,
  type DispatchTransition,
} from './dispatch-core'
import { buildRedstoneCsv, deriveDueDate, isRedstoneVendor } from './redstone-core'
import { isRedstoneConfigured } from './redstone-client'
import { handOffToRedstone } from './redstone-dispatch'

/**
 * Vendor fulfillment hand-off (IO layer). Pure decisions live in dispatch-core.
 *
 * Flow: verify the order is captured → pick a print vendor → build the
 * recipient CSV and sign the approved proof → email the vendor → record an
 * order_dispatches row. Status changes then walk the dispatch forward and
 * advance the customer-facing order status.
 */

/** Vendor links must outlive a vendor's turnaround, unlike customer proof links. */
const VENDOR_LINK_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

const ORDER_COLUMNS =
  'id, status, payment_status, stripe_payment_intent_id, record_count, proof_urls, ' +
  'metadata, mail_class, postage_type, created_by'

export interface DispatchResult {
  dispatchId: string
  vendorId: string
  vendorName: string
  recordCount: number
}

interface OrderRow extends DispatchableOrder {
  mail_class?: string | null
  postage_type?: string | null
  created_by?: string | null
}

interface ListDataLike {
  selectedListId?: string
  manualRecords?: unknown[]
}

/** Wizard state stores list selection under two generations of shape. */
function resolveListData(order: OrderRow): ListDataLike {
  const state = (order.metadata?.order_state ?? {}) as Record<string, unknown>
  const consolidated = (state.dataAndMapping as { listData?: ListDataLike } | undefined)?.listData
  return consolidated ?? (state.listData as ListDataLike | undefined) ?? {}
}

interface MailingOptionsLike {
  serviceLevel?: string
  mailPieceFormat?: string
  postageType?: string
}

/** Piece format / service level for the vendor payload live in wizard state. */
function resolveMailingOptions(order: OrderRow): MailingOptionsLike {
  const state = (order.metadata?.order_state ?? {}) as Record<string, unknown>
  return (state.mailingOptions as MailingOptionsLike | undefined) ?? {}
}

// mailing_list_records uses address_line1/address_line2 (no underscore before
// the digit) and has no company column, while wizard-state manual records use
// address_line_1/address_line_2/company. buildRecipientCsv reads the latter, so
// DB rows are normalized to that shape on the way out.
const RECIPIENT_COLUMNS =
  'first_name, last_name, address_line1, address_line2, city, state, zip_code, email, phone'

interface RecipientRow {
  first_name?: string | null
  last_name?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  email?: string | null
  phone?: string | null
}

function normalizeRecipient(row: RecipientRow): Record<string, unknown> {
  return {
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    address_line_1: row.address_line1 ?? '',
    address_line_2: row.address_line2 ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip_code: row.zip_code ?? '',
    company: '',
    email: row.email ?? '',
    phone: row.phone ?? '',
  }
}

async function loadRecipients(
  supabase: ReturnType<typeof createServiceClient>,
  order: OrderRow
): Promise<Record<string, unknown>[]> {
  const listData = resolveListData(order)

  if (listData.selectedListId) {
    const { data, error } = await supabase
      .from('mailing_list_records')
      .select(RECIPIENT_COLUMNS)
      .eq('mailing_list_id', listData.selectedListId)
    if (error) throw new Error(`Failed to load recipients: ${error.message}`)
    return ((data ?? []) as unknown as RecipientRow[]).map(normalizeRecipient)
  }

  return (listData.manualRecords ?? []) as Record<string, unknown>[]
}

export async function latestDispatch(orderId: string): Promise<Record<string, unknown> | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('order_dispatches')
    .select('*')
    .eq('order_id', orderId)
    .order('dispatched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Failed to load dispatch: ${error.message}`)
  return (data as Record<string, unknown> | null) ?? null
}

/**
 * Hand an order to a print vendor. Throws with an actionable message on every
 * refusal — callers surface it (admin) or log it (auto-dispatch).
 */
export async function dispatchOrder(opts: {
  orderId: string
  actorId: string
  vendorId?: string
}): Promise<DispatchResult> {
  const { orderId, actorId, vendorId } = opts
  const supabase = createServiceClient()

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('id', orderId)
    .single()

  if (orderError || !orderData) {
    throw new Error(`Order not found: ${orderError?.message ?? orderId}`)
  }
  const order = orderData as unknown as OrderRow

  const guard = canDispatch(order)
  if (!guard.ok) throw new Error(guard.reason)

  // One live dispatch per order; a failed one may be retried.
  const existing = await latestDispatch(orderId)
  if (existing && existing.status !== 'failed') {
    throw new Error(
      `Order already dispatched (status '${existing.status}') — update that dispatch instead of creating another`
    )
  }

  const vendor: VendorRecord | null = vendorId
    ? await getVendor(vendorId)
    : await findActivePrintVendor()

  if (!vendor) {
    throw new Error(
      vendorId
        ? `Vendor ${vendorId} not found`
        : 'No active print vendor configured — add one under Vendors before dispatching'
    )
  }
  if (!vendor.isActive) throw new Error(`Vendor "${vendor.name}" is inactive`)

  const recipients = await loadRecipients(supabase, order)
  if (recipients.length === 0) {
    throw new Error('Order has no recipients to mail — nothing to dispatch')
  }

  // API dispatch is opt-in per vendor and only when a key is present, so an
  // unconfigured environment silently keeps the (working) email hand-off.
  const useRedstone = isRedstoneVendor(vendor.contactInfo) && isRedstoneConfigured()

  // Recipient CSV joins the proof in the private bucket (both contain PII).
  // Redstone recognizes a different header set than our email contract
  // (address/zip, not Address_1/Zip_Code), so the staged file depends on
  // where it is headed.
  const csvPath = `dispatch/${orderId}/recipients.csv`
  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(csvPath, useRedstone ? buildRedstoneCsv(recipients) : buildRecipientCsv(recipients), {
      contentType: 'text/csv',
      upsert: true,
    })
  if (uploadError) throw new Error(`Failed to stage recipient list: ${uploadError.message}`)

  const proofPath = firstProofUrl(order.proof_urls)
  if (!proofPath) throw new Error('Order has no approved proof to send to the vendor')

  const [csvUrl, proofUrl] = await Promise.all([
    signProofUrl(supabase, csvPath, VENDOR_LINK_TTL_SECONDS),
    signProofUrl(supabase, proofPath, VENDOR_LINK_TTL_SECONDS),
  ])
  if (!csvUrl || !proofUrl) throw new Error('Failed to sign vendor download links')

  const { data: dispatchRow, error: insertError } = await supabase
    .from('order_dispatches')
    .insert({
      order_id: orderId,
      vendor_id: vendor.id,
      status: 'sent',
      package: {
        csvPath,
        proofPath,
        recordCount: recipients.length,
        provider: useRedstone ? 'redstone' : 'email',
      },
      created_by: actorId,
    })
    .select('id')
    .single()

  if (insertError || !dispatchRow) {
    // 23505 = unique_violation on uq_order_dispatches_live: a concurrent
    // dispatch won the race (the latestDispatch guard above is advisory only —
    // the partial unique index is the real gate). No vendor email was sent yet
    // for THIS attempt, so losing cleanly here means the vendor hears once.
    if (insertError?.code === '23505') {
      throw new Error('Order was just dispatched by another request — refresh to see it')
    }
    throw new Error(`Failed to record dispatch: ${insertError?.message ?? 'unknown error'}`)
  }
  const dispatchId = (dispatchRow as { id: string }).id

  const shortId = orderId.split('-')[0].toUpperCase()
  let handoff: string

  if (useRedstone) {
    // Throws (after marking the dispatch failed) on anything but accepted or
    // duplicate — unlike email, the API tells us immediately whether the vendor
    // actually has the job, so there is no silent-bounce case to tolerate.
    const mailingOptions = resolveMailingOptions(order)
    const message = await handOffToRedstone({
      supabase,
      orderId,
      dispatchId,
      shortId,
      recordCount: recipients.length,
      csvUrl,
      proofUrl,
      mailPieceFormat: mailingOptions.mailPieceFormat,
      postageType: mailingOptions.postageType ?? order.postage_type,
      serviceLevel: mailingOptions.serviceLevel,
    })
    handoff = `redstone-api: ${message}`
  } else {
    const vendorEmail = vendorContactEmail(vendor.contactInfo)
    if (!vendorEmail) {
      await supabase
        .from('order_dispatches')
        .update({
          status: 'failed',
          error: 'vendor has no contact email',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dispatchId)
      throw new Error(
        `Vendor "${vendor.name}" has no contact email — add one before dispatching`
      )
    }

    const sent = await trySendEmail(
      vendorEmail,
      vendorDispatchEmail({
        shortId,
        vendorName: vendor.name,
        recordCount: recipients.length,
        mailClass: order.mail_class ?? null,
        postageType: order.postage_type ?? null,
        proofUrl,
        csvUrl,
      })
    )
    if (!sent) {
      // The row stays 'sent' with the failure noted: the package is staged and an
      // admin can resend, which is better than losing the dispatch entirely.
      await supabase
        .from('order_dispatches')
        .update({ error: 'dispatch email failed to send', updated_at: new Date().toISOString() })
        .eq('id', dispatchId)
    }
    handoff = sent ? 'email: sent' : 'email: send failed'
  }

  await supabase
    .from('orders')
    .update({
      vendor_assignments: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        dispatchId,
        dispatchedAt: new Date().toISOString(),
      },
    })
    .eq('id', orderId)

  await logAdminAction({
    actorId,
    action: 'order_dispatched',
    targetType: 'order',
    targetId: orderId,
    newValue: { vendorId: vendor.id, vendorName: vendor.name, dispatchId, handoff },
  })

  return { dispatchId, vendorId: vendor.id, vendorName: vendor.name, recordCount: recipients.length }
}

const TIMESTAMP_FOR: Partial<Record<DispatchTransition, string>> = {
  accepted: 'accepted_at',
  shipped: 'shipped_at',
  delivered: 'delivered_at',
}

/**
 * Walk a dispatch forward. Advances the customer-facing order status when the
 * transition warrants it, and notifies the customer on ship.
 */
export async function updateDispatchStatus(opts: {
  orderId: string
  status: DispatchTransition
  actorId: string
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

  const { error: updateError } = await supabase
    .from('order_dispatches')
    .update(update)
    .eq('id', dispatch.id as string)
  if (updateError) throw new Error(`Failed to update dispatch: ${updateError.message}`)

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

  await logAdminAction({
    actorId,
    action: 'order_dispatch_status_changed',
    targetType: 'order',
    targetId: orderId,
    oldValue: { status: dispatch.status },
    newValue: { status, trackingNumber, trackingCarrier },
  })

  return { orderStatus: transition.orderStatus }
}
