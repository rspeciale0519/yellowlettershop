// Map the order wizard's loose orderState blob onto the normalized `orders`
// columns (DB1 model). Pure + tested. The full orderState is retained in
// `metadata` jsonb so proof generation / design rendering can still read it,
// while the queryable columns (status, totals, payment, mail class) are real.

export interface OrderInsert {
  created_by: string
  status: string
  record_count: number
  total_cost: number
  cost_per_piece: number | null
  mail_class: string | null
  postage_type: string | null
  stripe_payment_intent_id: string | null
  amount_authorized: number | null
  payment_status: string
  submitted_at: string
  metadata: Record<string, unknown>
}

type Loose = Record<string, any>

export function extractRecordCount(orderState: Loose): number {
  const v = orderState?.addressValidation ?? orderState?.accuzipValidation
  if (typeof v?.deliverableRecords === 'number') return v.deliverableRecords
  const ld = orderState?.dataAndMapping?.listData ?? orderState?.listData
  if (typeof ld?.totalRecords === 'number') return ld.totalRecords
  if (Array.isArray(ld?.manualRecords)) return ld.manualRecords.length
  return 0
}

export function extractTotal(orderState: Loose): number {
  const p = orderState?.pricing
  return typeof p?.totalPrice === 'number' ? p.totalPrice : 0
}

/** Build the normalized orders insert from the wizard state + verified payment. */
export function buildOrderInsert(
  orderState: Loose,
  userId: string,
  payment: { paymentIntentId: string | null; amountAuthorized: number | null },
  now: string
): OrderInsert {
  const mailing = orderState?.mailingOptions ?? orderState?.campaignSettings?.mailingOptions ?? {}
  const recordCount = extractRecordCount(orderState)
  const total = extractTotal(orderState)
  return {
    created_by: userId,
    status: 'submitted',
    record_count: recordCount,
    total_cost: total,
    cost_per_piece: recordCount > 0 ? Number((total / recordCount).toFixed(4)) : null,
    mail_class: typeof mailing.serviceLevel === 'string' ? mailing.serviceLevel : null,
    postage_type: typeof mailing.postageType === 'string' ? mailing.postageType : null,
    stripe_payment_intent_id: payment.paymentIntentId,
    amount_authorized: payment.amountAuthorized,
    payment_status: payment.paymentIntentId ? 'authorized' : 'pending',
    submitted_at: now,
    metadata: { order_state: orderState },
  }
}
