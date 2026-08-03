// Pure inbound-callback logic for Redstone status updates (spec §4.4) — no IO,
// no Supabase, no crypto. The route (app/api/webhooks/redstone/[token]) applies
// these decisions.

import type { DispatchTransition } from './dispatch-core'

/**
 * Redstone's documented statuses (spec §4.4), lowercased for matching:
 *   Preliminary Review   — their team is processing the job
 *   Production           — mapped out and sent to the production facility
 *   Completed Production — printed
 *   Delivery / Mailed    — left their facility, entering the mail stream
 *
 * Their spec also says: "We can map the status names that your platform is
 * expecting." So we additionally accept our own dispatch vocabulary verbatim,
 * and the request to them is to send our names. Either way works, which means
 * the integration is not broken by whichever choice they make.
 *
 * "Completed Production" maps to in_production, NOT shipped: printed is not
 * mailed, and `shipped` is what emails the customer that their mail is on its
 * way. Claiming that a day early is a promise we cannot take back.
 */
const STATUS_MAP: Record<string, DispatchTransition> = {
  // Redstone's vocabulary
  'preliminary review': 'accepted',
  production: 'in_production',
  'completed production': 'in_production',
  'delivery / mailed': 'shipped',
  'delivery/mailed': 'shipped',
  delivery: 'shipped',
  mailed: 'shipped',
  // Our own vocabulary, in case they map to it as offered
  accepted: 'accepted',
  in_production: 'in_production',
  'in production': 'in_production',
  shipped: 'shipped',
  delivered: 'delivered',
  failed: 'failed',
}

/** null = unrecognised. Callers must record it and refuse, never guess. */
export function mapRedstoneStatus(raw: unknown): DispatchTransition | null {
  if (typeof raw !== 'string') return null
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  return STATUS_MAP[key] ?? null
}

export interface RedstoneCallbackFields {
  /** Our order id — we send it to them as `id` on createOrder. */
  externalOrderId: string | null
  rawStatus: string | null
  status: DispatchTransition | null
  trackingNumber: string | null
  trackingCarrier: string | null
  /** Stable key for idempotency, or null if the payload gives us nothing. */
  dedupeKey: string | null
}

function firstString(body: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = body[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return null
}

/**
 * Redstone has not yet shown us a live callback body, and their spec documents
 * the statuses without pinning field names. So read permissively across the
 * plausible spellings rather than guessing one and hard-failing on the first
 * real call. Every raw body is persisted by the route, so the first genuine
 * callback lets us tighten this in a single edit.
 */
export function extractCallbackFields(body: unknown): RedstoneCallbackFields {
  if (!body || typeof body !== 'object') {
    return {
      externalOrderId: null,
      rawStatus: null,
      status: null,
      trackingNumber: null,
      trackingCarrier: null,
      dedupeKey: null,
    }
  }

  // Tolerate a single-key envelope, e.g. {"Order": {...}} — they wrap our
  // outbound payload on their end, so they may well wrap the inbound one.
  let flat = body as Record<string, unknown>
  const keys = Object.keys(flat)
  if (keys.length === 1) {
    const inner = flat[keys[0]]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      flat = { ...(inner as Record<string, unknown>), ...flat }
    }
  }

  const externalOrderId = firstString(flat, [
    'id',
    'ext_id',
    'order_id',
    'orderId',
    'orderID',
    'external_id',
  ])
  const rawStatus = firstString(flat, ['status', 'job_status', 'jobStatus', 'state'])
  const trackingNumber = firstString(flat, [
    'tracking',
    'tracking_number',
    'trackingNumber',
    'tracking_no',
  ])
  const trackingCarrier =
    firstString(flat, ['carrier', 'tracking_carrier', 'trackingCarrier']) ??
    (trackingNumber ? 'USPS' : null)

  const status = mapRedstoneStatus(rawStatus)

  // Same order + same status is the same event. Redstone defines no event id,
  // so this is the strongest key available; it makes a retry idempotent while
  // still allowing a genuine later transition through.
  const dedupeKey =
    externalOrderId && rawStatus
      ? `${externalOrderId}:${rawStatus.trim().toLowerCase()}`
      : null

  return {
    externalOrderId,
    rawStatus,
    status,
    trackingNumber,
    trackingCarrier,
    dedupeKey,
  }
}

/**
 * Redstone's spec §5 defines success as {"fail":false,"msg":"ok"}. We answer in
 * their vocabulary so their client treats our reply as a success rather than
 * retrying forever against a 200 it does not recognise.
 *
 * Note their spec prints the error example with "fail":false as well, which is
 * plainly a typo; we send true, which is the only reading that makes sense.
 */
export function redstoneAck(): { fail: false; msg: 'ok' } {
  return { fail: false, msg: 'ok' }
}

export function redstoneError(message: string): { fail: true; msg: string } {
  return { fail: true, msg: message }
}
