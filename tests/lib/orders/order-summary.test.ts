import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { summarizeOrderRow, ORDER_STATUS_STEPS, statusProgress } from '../../../lib/orders/order-summary'

describe('summarizeOrderRow', () => {
  it('lifts total, record count and format out of the order_state blob', () => {
    const row = {
      id: 'o1',
      status: 'submitted',
      submitted_at: '2026-06-12T00:00:00Z',
      proof_url: null,
      approved_at: null,
      captured_at: null,
      order_state: {
        pricing: { totalPrice: 123.45 },
        accuzipValidation: { deliverableRecords: 250 },
        mailingOptions: { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
      },
    }
    const s = summarizeOrderRow(row)
    assert.equal(s.id, 'o1')
    assert.equal(s.total, 123.45)
    assert.equal(s.recordCount, 250)
    assert.equal(s.mailPieceFormat, 'postcard_4x6')
    assert.equal(s.serviceLevel, 'full_service')
  })

  it('falls back to list totals when validation counts are absent', () => {
    const s = summarizeOrderRow({
      id: 'o2',
      status: 'submitted',
      submitted_at: '2026-06-12T00:00:00Z',
      order_state: {
        dataAndMapping: { listData: { totalRecords: 42 } },
      },
    })
    assert.equal(s.recordCount, 42)
    assert.equal(s.total, 0)
  })

  it('never throws on an empty blob', () => {
    const s = summarizeOrderRow({ id: 'o3', status: 'submitted', submitted_at: null, order_state: null })
    assert.equal(s.total, 0)
    assert.equal(s.recordCount, 0)
  })
})

describe('statusProgress', () => {
  it('orders the happy-path statuses as a strictly increasing timeline', () => {
    const happy = ['submitted', 'proof_ready', 'approved', 'processing', 'in_production', 'mailed', 'completed']
    const indices = happy.map(statusProgress)
    for (let i = 1; i < indices.length; i++) {
      assert.ok(indices[i] > indices[i - 1], `${happy[i]} must rank above ${happy[i - 1]}`)
    }
    assert.equal(ORDER_STATUS_STEPS.length, happy.length)
  })

  it('ranks terminal failure states at -1 (off the timeline)', () => {
    assert.equal(statusProgress('cancelled'), -1)
    assert.equal(statusProgress('rejected'), -1)
    assert.equal(statusProgress('unknown_status'), -1)
  })
})
