import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/utils/supabase/service'
import { latestDispatch } from '@/lib/fulfillment/dispatch-service'
import { updateDispatchStatus } from '@/lib/fulfillment/dispatch-status'
import { isRedstoneVendor } from '@/lib/fulfillment/redstone-core'
import {
  extractCallbackFields,
  redstoneAck,
  redstoneError,
} from '@/lib/fulfillment/redstone-status-core'
import { getVendor } from '@/lib/vendors/vendor-directory'

/**
 * Redstone job-status callback (their spec §4.4).
 *
 * AUTH: a high-entropy secret in the path. Redstone's system stores a URL and
 * nothing else — they told us "we just need the endpoint where we'll post that
 * data" — so a header secret or an HMAC would require development on their
 * side, which they quoted in weeks. A path token costs them nothing.
 *
 * The token is therefore NOT treated as sufficient on its own. This handler is
 * built so that a leaked token cannot do anything that was not already going
 * to happen:
 *   - it can only advance a dispatch that already exists,
 *   - only forward, through applyDispatchTransition's existing state machine,
 *   - only for a vendor actually flagged as Redstone,
 *   - idempotently, so a replay cannot re-email the customer,
 *   - and every call is recorded in vendor_status_callbacks either way.
 *
 * Responses use Redstone's own vocabulary ({"fail":false,"msg":"ok"}, spec §5)
 * so their client recognises success instead of retrying against a 200 it does
 * not understand.
 */

export const dynamic = 'force-dynamic'

/** Length-independent comparison; never leaks position via early exit. */
function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    // Still burn a comparison so timing does not distinguish "wrong length"
    // from "wrong value".
    timingSafeEqual(a, a)
    return false
  }
  return timingSafeEqual(a, b)
}

function clientIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

interface CallbackRecord {
  source: string
  external_order_id: string | null
  order_id: string | null
  raw_status: string | null
  mapped_status: string | null
  tracking_number: string | null
  tracking_carrier: string | null
  payload: unknown
  outcome: string
  detail: string | null
  source_ip: string | null
  dedupe_key: string | null
}

/** Records the call. Returns false when the unique index rejects a replay. */
async function record(row: CallbackRecord): Promise<boolean> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('vendor_status_callbacks').insert(row)
  if (error) {
    // 23505 on uq_vendor_status_callbacks_dedupe = we already processed this
    // exact event. That is the idempotency guarantee, not a failure.
    if (error.code === '23505') return false
    console.error('vendor_status_callbacks insert failed:', error.message)
  }
  return true
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const expected = process.env.REDSTONE_WEBHOOK_TOKEN
  const { token } = await context.params

  // Fail closed. Without a configured token every caller would otherwise be
  // authorised, which is the opposite of the intent.
  if (!expected || expected.length < 32) {
    console.error('REDSTONE_WEBHOOK_TOKEN is unset or too short — refusing callback')
    return NextResponse.json(redstoneError('Endpoint not configured'), { status: 503 })
  }
  if (!tokenMatches(token, expected)) {
    // Deliberately terse: never confirm whether the path shape was close.
    return NextResponse.json(redstoneError('Unauthorized'), { status: 401 })
  }

  const ip = clientIp(request)

  let body: unknown
  const raw = await request.text()
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    // Keep the unparseable body rather than discarding it — the equivalent
    // gap on the outbound side is exactly why we cannot answer Redstone's
    // question about their own error ids.
    await record({
      source: 'redstone',
      external_order_id: null,
      order_id: null,
      raw_status: null,
      mapped_status: null,
      tracking_number: null,
      tracking_carrier: null,
      payload: { unparsed: raw.slice(0, 4000) },
      outcome: 'error',
      detail: 'Body was not valid JSON',
      source_ip: ip,
      dedupe_key: null,
    })
    return NextResponse.json(redstoneError('Malformed JSON body'), { status: 400 })
  }

  const fields = extractCallbackFields(body)
  const base = {
    source: 'redstone',
    external_order_id: fields.externalOrderId,
    raw_status: fields.rawStatus,
    mapped_status: fields.status,
    tracking_number: fields.trackingNumber,
    tracking_carrier: fields.trackingCarrier,
    payload: body,
    source_ip: ip,
    dedupe_key: fields.dedupeKey,
  }

  if (!fields.externalOrderId || !fields.status) {
    await record({
      ...base,
      order_id: null,
      outcome: fields.externalOrderId ? 'rejected' : 'unmatched',
      detail: !fields.externalOrderId
        ? 'No order id found in payload'
        : `Unrecognised status '${fields.rawStatus}'`,
      dedupe_key: null,
    })
    return NextResponse.json(
      redstoneError(
        fields.externalOrderId
          ? `Unrecognised status '${fields.rawStatus}'`
          : 'Missing order id'
      ),
      { status: 400 }
    )
  }

  // We send our own order id as `id` on createOrder, so it comes back as one.
  const supabase = createServiceClient()
  const { data: orderRow } = await supabase
    .from('orders')
    .select('id')
    .eq('id', fields.externalOrderId)
    .maybeSingle()
  const orderId = (orderRow as { id?: string } | null)?.id ?? null

  if (!orderId) {
    // dedupe_key MUST be null here. Only a record of successful processing may
    // claim the key: if an unmatched attempt claimed it — say Redstone posts a
    // status a moment before the order row is visible — then every legitimate
    // retry of that status would collide with the unique index, be acked, and
    // be silently dropped forever.
    await record({
      ...base,
      order_id: null,
      outcome: 'unmatched',
      detail: 'No such order',
      dedupe_key: null,
    })
    // 200 on purpose: the payload was well-formed and the fault is not
    // Redstone's to retry. A 4xx here would have them redeliver forever.
    return NextResponse.json(redstoneError('Unknown order id'), { status: 200 })
  }

  // Idempotency gate BEFORE the transition, so a replay never re-sends the
  // customer's shipping email.
  const fresh = await record({ ...base, order_id: orderId, outcome: 'accepted', detail: null })
  if (!fresh) {
    return NextResponse.json(redstoneAck(), { status: 200 })
  }

  // Confirm this order really is dispatched to a Redstone vendor. Without it a
  // leaked token could drive orders that never went to Redstone at all.
  const dispatch = await latestDispatch(orderId)
  if (!dispatch) {
    await record({
      ...base,
      order_id: orderId,
      outcome: 'rejected',
      detail: 'Order has no dispatch',
      dedupe_key: null,
    })
    return NextResponse.json(redstoneError('Order has not been dispatched'), { status: 200 })
  }

  const vendor = await getVendor(dispatch.vendor_id as string)
  if (!vendor || !isRedstoneVendor(vendor.contactInfo)) {
    await record({
      ...base,
      order_id: orderId,
      outcome: 'rejected',
      detail: 'Dispatch vendor is not Redstone',
      dedupe_key: null,
    })
    return NextResponse.json(redstoneError('Order is not a Redstone dispatch'), { status: 200 })
  }

  try {
    const result = await updateDispatchStatus({
      orderId,
      status: fields.status,
      actorId: null, // vendor callback — audited in vendor_status_callbacks
      ...(fields.trackingNumber ? { trackingNumber: fields.trackingNumber } : {}),
      ...(fields.trackingCarrier ? { trackingCarrier: fields.trackingCarrier } : {}),
    })
    return NextResponse.json(
      { ...redstoneAck(), order_status: result.orderStatus },
      { status: 200 }
    )
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Transition failed'
    await record({
      ...base,
      order_id: orderId,
      outcome: 'rejected',
      detail,
      dedupe_key: null,
    })
    // A refused transition (backwards, or already past this stage) is not a
    // Redstone error and must not be retried — answer 200 with the reason.
    return NextResponse.json(redstoneError(detail), { status: 200 })
  }
}
