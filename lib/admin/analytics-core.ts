// Pure revenue aggregation over the normalized orders model.
//
// Payment state is inline on `orders` (stripe_payment_intent_id,
// amount_authorized/captured/refunded, payment_status) — there is no
// payment_transactions table. Amounts here are DOLLARS; the Stripe boundary
// (lib/payments/payment-intent-service.ts) is the only place cents are
// converted. Never divide by 100 in this file.

export interface RevenueOrderRow {
  amount_captured: number | null
  amount_refunded?: number | null
  captured_at?: string | null
  created_at?: string | null
  created_by?: string | null
}

export interface RevenueDay {
  date: string
  revenue: number
  orders: number
}

export interface CustomerTotal {
  userId: string
  total: number
  orderCount: number
}

/**
 * Capture-time for bucketing. Legacy rows predate `captured_at`, so fall back
 * to creation time. (`orders` has NO updated_at column — never reference one.)
 */
function captureDate(row: RevenueOrderRow): string {
  return (row.captured_at ?? row.created_at ?? '').slice(0, 10)
}

/** Net dollars actually collected: captured minus refunded. */
export function netRevenue(rows: RevenueOrderRow[]): number {
  return rows.reduce(
    (sum, r) => sum + (Number(r.amount_captured) || 0) - (Number(r.amount_refunded) || 0),
    0
  )
}

/** Daily revenue series, ascending by date. Uncaptured orders are excluded. */
export function revenueByDay(rows: RevenueOrderRow[]): RevenueDay[] {
  const grouped: Record<string, { revenue: number; orders: number }> = {}

  for (const row of rows) {
    if (typeof row.amount_captured !== 'number') continue
    const date = captureDate(row)
    if (!date) continue
    grouped[date] ??= { revenue: 0, orders: 0 }
    grouped[date].revenue += row.amount_captured - (Number(row.amount_refunded) || 0)
    grouped[date].orders += 1
  }

  return Object.entries(grouped)
    .map(([date, totals]) => ({ date, ...totals }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Lifetime spend per customer, highest first. Uncaptured orders excluded. */
export function topCustomerTotals(rows: RevenueOrderRow[]): CustomerTotal[] {
  const totals: Record<string, { total: number; orderCount: number }> = {}

  for (const row of rows) {
    if (!row.created_by || typeof row.amount_captured !== 'number') continue
    totals[row.created_by] ??= { total: 0, orderCount: 0 }
    totals[row.created_by].total += row.amount_captured - (Number(row.amount_refunded) || 0)
    totals[row.created_by].orderCount += 1
  }

  return Object.entries(totals)
    .map(([userId, t]) => ({ userId, ...t }))
    .sort((a, b) => b.total - a.total)
}
