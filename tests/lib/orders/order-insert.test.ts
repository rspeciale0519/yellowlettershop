import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { buildOrderInsert, extractRecordCount, extractTotal } from '../../../lib/orders/order-insert'

const state = {
  pricing: { totalPrice: 250 },
  accuzipValidation: { deliverableRecords: 100 },
  mailingOptions: { serviceLevel: 'full_service', postageType: 'first_class_forever' },
}

describe('extractRecordCount / extractTotal', () => {
  it('prefers deliverable validation count', () => {
    assert.equal(extractRecordCount(state), 100)
  })
  it('falls back to list totals then manual length', () => {
    assert.equal(extractRecordCount({ dataAndMapping: { listData: { totalRecords: 42 } } }), 42)
    assert.equal(extractRecordCount({ listData: { manualRecords: [1, 2, 3] } }), 3)
    assert.equal(extractRecordCount({}), 0)
  })
  it('reads pricing.totalPrice, default 0', () => {
    assert.equal(extractTotal(state), 250)
    assert.equal(extractTotal({}), 0)
  })
})

describe('buildOrderInsert', () => {
  it('maps wizard state + payment onto normalized columns', () => {
    const ins = buildOrderInsert(
      state,
      'user-1',
      { paymentIntentId: 'pi_123', amountAuthorized: 250 },
      '2026-06-13T00:00:00Z'
    )
    assert.equal(ins.created_by, 'user-1')
    assert.equal(ins.status, 'submitted')
    assert.equal(ins.record_count, 100)
    assert.equal(ins.total_cost, 250)
    assert.equal(ins.cost_per_piece, 2.5)
    assert.equal(ins.mail_class, 'full_service')
    assert.equal(ins.postage_type, 'first_class_forever')
    assert.equal(ins.stripe_payment_intent_id, 'pi_123')
    assert.equal(ins.amount_authorized, 250)
    assert.equal(ins.payment_status, 'authorized')
    assert.deepEqual(ins.metadata, { order_state: state })
  })

  it('payment_status pending + null cost_per_piece when no payment / zero records', () => {
    const ins = buildOrderInsert({}, 'u', { paymentIntentId: null, amountAuthorized: null }, 't')
    assert.equal(ins.payment_status, 'pending')
    assert.equal(ins.cost_per_piece, null)
    assert.equal(ins.record_count, 0)
  })
})
