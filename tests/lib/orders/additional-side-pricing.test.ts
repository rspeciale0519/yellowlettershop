import { strict as assert } from 'assert'
import { getAdditionalSideChargeCents, getProductPrintPolicy } from '../../../lib/orders/additional-side-pricing'
import { calculatePricing, DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { toPricingBreakdown } from '../../../lib/orders/pricing-breakdown'

describe('additional printed sides', () => {
  it('charges each extra printed side at exactly ten cents per piece', () => {
    for (const [sides, included, quantity, expected] of [[1,1,1000,0], [2,1,1000,10000], [3,1,1000,20000], [2,1,250,2500], [2,2,1000,0]]) {
      assert.equal(getAdditionalSideChargeCents(sides, included, quantity), expected)
    }
  })
  it('rejects invalid counts and unsafe money', () => {
    for (const count of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      assert.throws(() => getAdditionalSideChargeCents(2, 1, count))
    }
  })
  it('owns letter and fixed postcard policy', () => {
    assert.deepEqual(getProductPrintPolicy('letter_8_5x11'), { includedPrintedSides: 1, allowAdditionalPages: true, additionalPrintedSideCents: 10 })
    assert.equal(getProductPrintPolicy('postcard_4x6').includedPrintedSides, 2)
    assert.equal(getProductPrintPolicy('postcard_4x6').allowAdditionalPages, false)
  })
  it('adds the fee after volume discount and itemizes it', () => {
    const result = calculatePricing({ serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11' }, 1000, DEFAULT_PRICING, { printedSideCount: 3, includedPrintedSides: 1 })
    assert.equal(result.discount, 37.5)
    assert.equal(result.additionalSideChargeCents, 20000)
    assert.equal(result.total, 912.5)
    const b = toPricingBreakdown(result)
    assert.equal(b.addOnServices.find(line => line.id === 'additional_printed_sides')?.totalPrice, 200)
  })
})
