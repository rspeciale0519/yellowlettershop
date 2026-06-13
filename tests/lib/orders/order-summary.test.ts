import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  summarizeOrderRow,
  deriveDisplayStatus,
  firstProofUrl,
  statusProgress,
  ORDER_STATUS_STEPS,
} from '../../../lib/orders/order-summary'

describe('summarizeOrderRow (normalized orders)', () => {
  it('reads the normalized columns directly', () => {
    const s = summarizeOrderRow({
      id: 'o1',
      status: 'processing',
      submitted_at: '2026-06-12T00:00:00Z',
      proof_urls: ['https://x/proof.pdf'],
      proof_approved_at: '2026-06-12T01:00:00Z',
      payment_status: 'captured',
      amount_authorized: 123.45,
      amount_captured: 123.45,
      total_cost: 123.45,
      record_count: 250,
      mail_class: 'first_class',
      postage_type: 'forever',
    })
    assert.equal(s.id, 'o1')
    assert.equal(s.total, 123.45)
    assert.equal(s.recordCount, 250)
    assert.equal(s.mailClass, 'first_class')
    assert.equal(s.amountCaptured, 123.45)
    assert.equal(s.proofUrl, 'https://x/proof.pdf')
    assert.equal(s.displayStatus, 'processing')
  })

  it('falls back to created_at when submitted_at is absent and defaults numerics', () => {
    const s = summarizeOrderRow({ id: 'o2', status: 'draft', created_at: '2026-06-01T00:00:00Z' })
    assert.equal(s.submittedAt, '2026-06-01T00:00:00Z')
    assert.equal(s.total, 0)
    assert.equal(s.recordCount, 0)
    assert.equal(s.proofUrl, null)
  })
})

describe('deriveDisplayStatus', () => {
  it('maps fulfillment statuses straight through', () => {
    assert.equal(deriveDisplayStatus({ id: 'x', status: 'processing' }), 'processing')
    assert.equal(deriveDisplayStatus({ id: 'x', status: 'shipped' }), 'shipped')
    assert.equal(deriveDisplayStatus({ id: 'x', status: 'completed' }), 'completed')
  })
  it('refines submitted by the proof gate', () => {
    assert.equal(deriveDisplayStatus({ id: 'x', status: 'submitted' }), 'submitted')
    assert.equal(
      deriveDisplayStatus({ id: 'x', status: 'submitted', proof_urls: ['u'] }),
      'proof_ready'
    )
    assert.equal(
      deriveDisplayStatus({ id: 'x', status: 'submitted', proof_urls: ['u'], proof_approved_at: 't' }),
      'proof_approved'
    )
  })
  it('passes terminal failure states through as off-path', () => {
    assert.equal(deriveDisplayStatus({ id: 'x', status: 'failed' }), 'failed')
    assert.equal(statusProgress('failed'), -1)
  })
})

describe('firstProofUrl', () => {
  it('handles string, array, and object jsonb shapes', () => {
    assert.equal(firstProofUrl('u'), 'u')
    assert.equal(firstProofUrl(['a', 'b']), 'a')
    assert.equal(firstProofUrl({ front: 'f' }), 'f')
    assert.equal(firstProofUrl({ url: 'z' }), 'z')
    assert.equal(firstProofUrl(null), null)
    assert.equal(firstProofUrl({}), null)
  })
})

describe('statusProgress timeline', () => {
  it('is strictly increasing along the happy path', () => {
    const order = ['submitted', 'proof_ready', 'proof_approved', 'processing', 'shipped', 'completed']
    const idx = order.map(statusProgress)
    for (let i = 1; i < idx.length; i++) assert.ok(idx[i] > idx[i - 1])
    assert.equal(ORDER_STATUS_STEPS.length, order.length)
  })
})
