import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { inlinePayments } from '../../../lib/admin/order-service'

// Payment state is inline on the order row; the admin detail view still wants a
// list-shaped "payments" block, so it is derived rather than queried.
describe('inlinePayments', () => {
  it('derives a one-row payment view from inline order columns', () => {
    const rows = inlinePayments({
      stripe_payment_intent_id: 'pi_1',
      payment_status: 'captured',
      total_cost: 217.5,
      amount_captured: 217.5,
      amount_refunded: null,
      captured_at: '2026-08-01T10:00:00Z',
      refunded_at: null,
    })

    assert.equal(rows.length, 1)
    assert.equal(rows[0].stripe_payment_intent_id, 'pi_1')
    assert.equal(rows[0].status, 'captured')
    assert.equal(rows[0].amount_captured, 217.5)
    assert.equal(rows[0].captured_at, '2026-08-01T10:00:00Z')
  })

  it('returns [] when the order has no payment intent', () => {
    assert.deepEqual(inlinePayments({ stripe_payment_intent_id: null }), [])
    assert.deepEqual(inlinePayments({}), [])
  })

  it('surfaces refunds', () => {
    const rows = inlinePayments({
      stripe_payment_intent_id: 'pi_2',
      payment_status: 'refunded',
      total_cost: 100,
      amount_captured: 100,
      amount_refunded: 40,
      refunded_at: '2026-08-05T00:00:00Z',
    })
    assert.equal(rows[0].amount_refunded, 40)
    assert.equal(rows[0].status, 'refunded')
  })
})
