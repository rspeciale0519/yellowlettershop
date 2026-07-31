// Pure fulfillment logic — no IO, no Supabase, no Stripe. Everything here is
// decision-making the dispatch service (dispatch-service.ts) applies.

export interface DispatchableOrder {
  id: string
  status: string
  payment_status: string | null
  stripe_payment_intent_id?: string | null
  record_count?: number | null
  proof_urls?: unknown
  metadata?: { order_state?: Record<string, unknown> } | null
}

export type DispatchGuard = { ok: true } | { ok: false; reason: string }

/**
 * May this order be handed to a vendor?
 *
 * Two hard rules: the order must have reached production ('processing', which
 * is what proof-approval + capture sets), and the money must actually be
 * captured. Never send work to a printer that hasn't been paid for.
 */
export function canDispatch(order: DispatchableOrder): DispatchGuard {
  if (order.status !== 'processing') {
    return {
      ok: false,
      reason: `Order is '${order.status}' — only captured orders in 'processing' can be dispatched`,
    }
  }
  if (order.payment_status !== 'captured') {
    return {
      ok: false,
      reason: `Payment is '${order.payment_status ?? 'missing'}', not captured — refusing to dispatch unpaid work`,
    }
  }
  return { ok: true }
}

/** Column contract handed to print vendors. Order is part of the contract. */
const CSV_COLUMNS = [
  'Record_ID',
  'First_Name',
  'Last_Name',
  'Address_1',
  'Address_2',
  'City',
  'State',
  'Zip_Code',
  'Company',
  'Email',
  'Phone',
] as const

const FIELD_KEYS = [
  'first_name',
  'last_name',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'zip_code',
  'company',
  'email',
  'phone',
] as const

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Recipient CSV for the vendor. Record_ID is a 1-based sequence number so the
 * vendor can reference specific pieces back to us in proofs and returns.
 */
export function buildRecipientCsv(records: Record<string, unknown>[]): string {
  const rows = records.map((record, i) =>
    [i + 1, ...FIELD_KEYS.map((k) => record[k])].map(csvCell).join(',')
  )
  return [CSV_COLUMNS.join(','), ...rows].join('\n') + '\n'
}

/** Pull a usable send-to address out of the vendor's contact_info jsonb. */
export function vendorContactEmail(contactInfo: unknown): string | null {
  if (!contactInfo || typeof contactInfo !== 'object') return null
  const email = (contactInfo as Record<string, unknown>).email
  if (typeof email !== 'string') return null
  return email.includes('@') ? email : null
}

export type DispatchTransition =
  | 'accepted'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'failed'

/** Dispatch lifecycle order. Forward-only (skipping ahead is allowed). */
const STAGE_ORDER: Record<string, number> = {
  sent: 0,
  accepted: 1,
  in_production: 2,
  shipped: 3,
  delivered: 4,
}

/** Which dispatch stages move the customer-facing order status. */
const ORDER_STATUS_FOR: Partial<Record<DispatchTransition, 'shipped' | 'completed'>> = {
  shipped: 'shipped',
  delivered: 'completed',
}

export type TransitionResult =
  | { ok: true; orderStatus: 'shipped' | 'completed' | null }
  | { ok: false; reason: string }

/**
 * Validate a dispatch status change and report whether the order status should
 * move with it. 'failed' is always reachable (a vendor can reject at any point)
 * and never advances the order.
 */
export function applyDispatchTransition(
  current: string,
  next: DispatchTransition
): TransitionResult {
  if (next === 'failed') return { ok: true, orderStatus: null }

  const from = STAGE_ORDER[current]
  const to = STAGE_ORDER[next]

  if (from === undefined) {
    return { ok: false, reason: `Unknown dispatch state '${current}'` }
  }
  if (to <= from) {
    return { ok: false, reason: `Cannot move dispatch from '${current}' back to '${next}'` }
  }

  return { ok: true, orderStatus: ORDER_STATUS_FOR[next] ?? null }
}
