// Pure helpers shared by the orders list/detail APIs and the status page.
// Reads the normalized (DB1-model) orders columns and derives a customer-facing
// timeline from order_status + proof_approved_at + payment_status.

export interface OrderSummary {
  id: string
  status: string // raw order_status enum
  displayStatus: string // derived timeline step (see ORDER_STATUS_STEPS)
  submittedAt: string | null
  proofUrl: string | null
  proofApprovedAt: string | null
  paymentStatus: string | null
  amountAuthorized: number | null
  amountCaptured: number | null
  total: number
  recordCount: number
  mailClass: string | null
  postageType: string | null
}

/** Customer-facing happy-path timeline (display order). */
export const ORDER_STATUS_STEPS = [
  { status: 'submitted', label: 'Order submitted' },
  { status: 'proof_ready', label: 'Proof ready for review' },
  { status: 'proof_approved', label: 'Proof approved' },
  { status: 'processing', label: 'In production' },
  { status: 'shipped', label: 'Mailed' },
  { status: 'completed', label: 'Delivered' },
] as const

/** Index of a derived displayStatus on the timeline; -1 for off-path states. */
export function statusProgress(displayStatus: string): number {
  return ORDER_STATUS_STEPS.findIndex((s) => s.status === displayStatus)
}

type ProofUrls = unknown

/** proof_urls is jsonb: accept string | string[] | {url|front|...}. Return first. */
export function firstProofUrl(proof: ProofUrls): string | null {
  if (!proof) return null
  if (typeof proof === 'string') return proof || null
  if (Array.isArray(proof)) {
    const s = proof.find((u) => typeof u === 'string' && u)
    return (s as string) ?? null
  }
  if (typeof proof === 'object') {
    const o = proof as Record<string, unknown>
    for (const k of ['url', 'front', 'proofUrl', 'pdf']) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string
    }
  }
  return null
}

interface OrderRow {
  id: string
  status: string
  submitted_at?: string | null
  created_at?: string | null
  proof_urls?: unknown
  proof_approved_at?: string | null
  payment_status?: string | null
  amount_authorized?: number | null
  amount_captured?: number | null
  total_cost?: number | null
  record_count?: number | null
  mail_class?: string | null
  postage_type?: string | null
}

/**
 * Derive the customer-facing step from the normalized state. order_status drives
 * fulfillment (submitted→processing→shipped→completed); the proof gate
 * (proof_urls / proof_approved_at) refines the pre-production phase.
 */
export function deriveDisplayStatus(row: OrderRow): string {
  const st = row.status
  if (st === 'failed' || st === 'cancelled' || st === 'rejected') return st
  if (st === 'completed') return 'completed'
  if (st === 'shipped') return 'shipped'
  if (st === 'processing') return 'processing'
  // draft/submitted: refine by proof gate
  if (row.proof_approved_at) return 'proof_approved'
  if (firstProofUrl(row.proof_urls)) return 'proof_ready'
  return 'submitted'
}

/** Flatten a normalized orders row into the list/detail summary. */
export function summarizeOrderRow(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    status: row.status,
    displayStatus: deriveDisplayStatus(row),
    submittedAt: row.submitted_at ?? row.created_at ?? null,
    proofUrl: firstProofUrl(row.proof_urls),
    proofApprovedAt: row.proof_approved_at ?? null,
    paymentStatus: row.payment_status ?? null,
    amountAuthorized: typeof row.amount_authorized === 'number' ? row.amount_authorized : null,
    amountCaptured: typeof row.amount_captured === 'number' ? row.amount_captured : null,
    total: typeof row.total_cost === 'number' ? row.total_cost : 0,
    recordCount: typeof row.record_count === 'number' ? row.record_count : 0,
    mailClass: row.mail_class ?? null,
    postageType: row.postage_type ?? null,
  }
}
