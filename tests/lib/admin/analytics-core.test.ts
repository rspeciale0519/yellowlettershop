import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  netRevenue,
  revenueByDay,
  topCustomerTotals,
} from '../../../lib/admin/analytics-core'

// Money on orders is stored in DOLLARS (numeric). The dead payment_transactions
// code these functions replace stored CENTS and divided by 100 — these tests
// exist to pin that the division must NOT come along with the port.
const rows = [
  { amount_captured: 217.5, captured_at: '2026-08-01T10:00:00Z', created_by: 'u1' },
  { amount_captured: 100, amount_refunded: 25, captured_at: '2026-08-01T12:00:00Z', created_by: 'u2' },
  { amount_captured: 50, captured_at: null, updated_at: '2026-08-02T09:00:00Z', created_by: 'u1' },
  { amount_captured: null, created_at: '2026-08-02T09:00:00Z', created_by: 'u3' },
]

describe('analytics-core', () => {
  it('netRevenue sums dollars minus refunds, no cents conversion', () => {
    assert.equal(netRevenue(rows), 217.5 + 100 + 50 - 25)
  })

  // All three aggregates net refunds, so the daily series always sums to the
  // headline netRevenue figure. A refund is attributed to the original capture
  // date (sale-date attribution), which is why 2026-08-01 shows 292.5 not 317.5.
  it('revenueByDay buckets by capture date with fallbacks, nets refunds, skips uncaptured', () => {
    assert.deepEqual(revenueByDay(rows), [
      { date: '2026-08-01', revenue: 292.5, orders: 2 },
      { date: '2026-08-02', revenue: 50, orders: 1 },
    ])
  })

  it('daily series sums to netRevenue', () => {
    const dailyTotal = revenueByDay(rows).reduce((s, d) => s + d.revenue, 0)
    assert.equal(dailyTotal, netRevenue(rows))
  })

  it('topCustomerTotals groups by created_by, nets refunds, sorted desc', () => {
    assert.deepEqual(topCustomerTotals(rows), [
      { userId: 'u1', total: 267.5, orderCount: 2 },
      { userId: 'u2', total: 75, orderCount: 1 },
    ])
  })

  it('handles an empty result set without throwing', () => {
    assert.equal(netRevenue([]), 0)
    assert.deepEqual(revenueByDay([]), [])
    assert.deepEqual(topCustomerTotals([]), [])
  })
})
