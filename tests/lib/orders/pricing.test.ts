import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing } from '../../../lib/orders/pricing'

describe('calculatePricing', () => {
  it('calculates base postcard with no postage', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      100
    )
    assert.equal(result.printing, 4.50)       // 100 * $0.045
    assert.equal(result.postage, null)
    assert.equal(result.total, 4.50)
    assert.equal(result.recordCount, 100)
  })

  it('includes postage when includePostage is true', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_forever' },
      100
    )
    assert.equal(result.postage, 7.30)        // 100 * $0.073
    assert.equal(result.total, 11.80)
  })

  it('applies 5% volume discount at 1000+ records', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      1000
    )
    // printing = 45000 cents, discount = floor(45000 * 0.05) = 2250 cents = $22.50
    assert.equal(result.discount, 22.50)
    assert.equal(result.total, 45.00 - 22.50)
  })

  it('falls back to first_class_forever when discounted rate requested under 200 records', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_discounted' },
      100
    )
    assert.equal(result.postage, 7.30)        // fell back to first_class_forever rate
  })
})
