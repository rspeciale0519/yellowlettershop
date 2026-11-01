import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { DEFAULT_PRICING } from '../../../lib/orders/pricing'
import {
  buildPricingCatalog,
  PRICING_EXAMPLE_COUNTS,
} from '../../../lib/orders/pricing-examples'

describe('pricing catalog GET payload', () => {
  it('returns only server-trusted example counts and never echoes a client recordCount', () => {
    const clientCount = new URL(
      'http://local.test/api/orders/calculate-pricing?recordCount=1'
    ).searchParams.get('recordCount')
    assert.equal(clientCount, '1')

    const payload = buildPricingCatalog(DEFAULT_PRICING)
    assert.equal('recordCount' in payload, false)
    assert.equal(payload.examples.postcard_4x6_500.recordCount, PRICING_EXAMPLE_COUNTS.postcard_4x6)
    assert.equal(payload.examples.postcard_5x7_1000.recordCount, PRICING_EXAMPLE_COUNTS.postcard_5x7)
    assert.equal(payload.examples.letter_2500.recordCount, PRICING_EXAMPLE_COUNTS.letter)
    assert.notEqual(payload.examples.postcard_4x6_500.recordCount, Number(clientCount))
  })
})
