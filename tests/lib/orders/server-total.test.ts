import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing, DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { extractTotal } from '../../../lib/orders/order-insert'
import { amountsMatchCents, computeServerOrderTotal } from '../../../lib/orders/server-total'

const realOrder = {
  pricing: { totalPrice: 0.01 },
  accuzipValidation: { deliverableRecords: 1000 },
  mailingOptions: {
    serviceLevel: 'full_service',
    mailPieceFormat: 'postcard_4x6',
    postageType: 'first_class_forever',
    includePostage: true,
  },
}

describe('computeServerOrderTotal', () => {
  it('ignores a client-supplied $0.01 total (price tamper)', () => {
    const expected = calculatePricing(
      {
        serviceLevel: 'full_service',
        mailPieceFormat: 'postcard_4x6',
        postageType: 'first_class_forever',
        includePostage: true,
      },
      1000,
      DEFAULT_PRICING
    )
    assert.equal(extractTotal(realOrder), 0.01)
    const server = computeServerOrderTotal(realOrder, DEFAULT_PRICING, 1000)
    assert.equal(server.ok, true)
    if (!server.ok) return
    assert.equal(server.total, expected.total)
    assert.ok(server.total > 1)
    assert.equal(amountsMatchCents(1, server.total), false)
    assert.equal(amountsMatchCents(Math.round(server.total * 100), server.total), true)
  })

  it('fails closed without mailing options or a trusted record count', () => {
    assert.equal(computeServerOrderTotal({ pricing: { totalPrice: 50 } }).ok, false)
    assert.equal(
      computeServerOrderTotal({ mailingOptions: { serviceLevel: 'print_only' } }).ok,
      false
    )
    assert.equal(computeServerOrderTotal(realOrder, DEFAULT_PRICING, 0).ok, false)
  })
})
