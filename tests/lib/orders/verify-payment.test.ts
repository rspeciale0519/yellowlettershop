import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { verifyAuthorizedPayment } from '../../../lib/orders/verify-payment'

describe('verifyAuthorizedPayment', () => {
  it('rejects when no payment intent was found for the user (IDOR/none)', () => {
    const r = verifyAuthorizedPayment(null, 100)
    assert.equal(r.ok, false)
    assert.match(r.reason!, /not found|authoriz/i)
  })

  it('accepts a requires_capture intent whose amount matches the order total', () => {
    const r = verifyAuthorizedPayment({ status: 'requires_capture', amount: 123.45 }, 123.45)
    assert.equal(r.ok, true)
  })

  it('accepts the "authorized" status alias', () => {
    const r = verifyAuthorizedPayment({ status: 'authorized', amount: 50 }, 50)
    assert.equal(r.ok, true)
  })

  it('rejects an unauthorized status (e.g. requires_payment_method)', () => {
    const r = verifyAuthorizedPayment({ status: 'requires_payment_method', amount: 50 }, 50)
    assert.equal(r.ok, false)
    assert.match(r.reason!, /status/i)
  })

  it('rejects when the authorized amount does not match the order total (tampering)', () => {
    const r = verifyAuthorizedPayment({ status: 'requires_capture', amount: 5 }, 500)
    assert.equal(r.ok, false)
    assert.match(r.reason!, /amount/i)
  })

  it('tolerates sub-cent rounding differences', () => {
    const r = verifyAuthorizedPayment({ status: 'requires_capture', amount: 99.999 }, 100)
    assert.equal(r.ok, true)
  })

  it('rejects a non-positive or missing order total', () => {
    assert.equal(verifyAuthorizedPayment({ status: 'requires_capture', amount: 0 }, 0).ok, false)
  })
})
