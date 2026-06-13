// Pure helpers shared by the orders list/detail APIs and the status page.

export interface OrderSummary {
  id: string
  status: string
  submittedAt: string | null
  proofUrl: string | null
  approvedAt: string | null
  capturedAt: string | null
  total: number
  recordCount: number
  serviceLevel: string | null
  mailPieceFormat: string | null
}

/** Happy-path lifecycle in display order (status page timeline). */
export const ORDER_STATUS_STEPS = [
  { status: 'submitted', label: 'Order submitted' },
  { status: 'proof_ready', label: 'Proof ready for review' },
  { status: 'approved', label: 'Proof approved' },
  { status: 'processing', label: 'Payment captured' },
  { status: 'in_production', label: 'In production' },
  { status: 'mailed', label: 'Mailed' },
  { status: 'completed', label: 'Completed' },
] as const

/** Index of a status on the happy-path timeline; -1 for off-path states. */
export function statusProgress(status: string): number {
  return ORDER_STATUS_STEPS.findIndex((s) => s.status === status)
}

interface ListLike {
  totalRecords?: unknown
  manualRecords?: unknown[]
}

interface StateBlob {
  pricing?: { totalPrice?: unknown }
  addressValidation?: { deliverableRecords?: unknown }
  accuzipValidation?: { deliverableRecords?: unknown }
  dataAndMapping?: { listData?: ListLike }
  listData?: ListLike
  mailingOptions?: { serviceLevel?: unknown; mailPieceFormat?: unknown }
  campaignSettings?: { mailingOptions?: { serviceLevel?: unknown; mailPieceFormat?: unknown } }
}

type Row = {
  id: string
  status: string
  submitted_at?: string | null
  proof_url?: string | null
  approved_at?: string | null
  captured_at?: string | null
  order_state?: StateBlob | null
}

/** Flatten a DB row + its order_state blob into the list/detail summary. */
export function summarizeOrderRow(row: Row): OrderSummary {
  const state: StateBlob = row.order_state ?? {}
  const pricing = state.pricing ?? {}
  const validation = state.addressValidation ?? state.accuzipValidation
  const listData = state.dataAndMapping?.listData ?? state.listData
  const mailing = state.mailingOptions ?? state.campaignSettings?.mailingOptions ?? {}

  const recordCount =
    (typeof validation?.deliverableRecords === 'number' && validation.deliverableRecords) ||
    (typeof listData?.totalRecords === 'number' && listData.totalRecords) ||
    (Array.isArray(listData?.manualRecords) ? listData.manualRecords.length : 0)

  return {
    id: row.id,
    status: row.status,
    submittedAt: row.submitted_at ?? null,
    proofUrl: row.proof_url ?? null,
    approvedAt: row.approved_at ?? null,
    capturedAt: row.captured_at ?? null,
    total: typeof pricing.totalPrice === 'number' ? pricing.totalPrice : 0,
    recordCount,
    serviceLevel: typeof mailing.serviceLevel === 'string' ? mailing.serviceLevel : null,
    mailPieceFormat: typeof mailing.mailPieceFormat === 'string' ? mailing.mailPieceFormat : null,
  }
}
