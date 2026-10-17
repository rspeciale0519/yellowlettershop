import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing } from '../../../lib/orders/pricing'

// Mailing prices are the published postage-inclusive tiers. Legacy printing
// component rates remain cents; no per-piece amount may be divided by 1000.
describe('calculatePricing', () => {
  it('includes postage in a full-service postcard even when the flag is omitted', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      100
    )
    assert.equal(result.printing, 125.00)     // 100 × published $1.25, postage included.
    assert.equal(result.postage, null)
    assert.equal(result.total, 125.00)
    assert.equal(result.recordCount, 100)
  })

  it('does not add postage a second time when includePostage is true', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_forever' },
      100
    )
    assert.equal(result.postage, null)
    assert.equal(result.total, 125.00)
    assert.equal(result.pricePerPiece, 1.25)
  })

  it('prices a single postcard above the Stripe $0.50 minimum', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_forever' },
      1
    )
    assert.equal(result.total, 1.25)
    assert.ok(result.total >= 0.5, 'a 1-piece order must clear the Stripe minimum charge')
  })

  it('retains the separate component discount for existing non-mailing printing', () => {
    const result = calculatePricing(
      { serviceLevel: 'ship_processed', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      1000
    )
    // printing = 45000 cents = $450; discount = floor(45000 × 0.05) = 2250 cents = $22.50
    assert.equal(result.printing, 450.00)
    assert.equal(result.discount, 22.50)
    assert.equal(result.shipping, 35)
    assert.equal(result.total, 450.00 - 22.50 + 35)
  })

  it('uses the published First Class price for a small order with the legacy discounted choice', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_discounted' },
      100
    )
    assert.equal(result.postage, null)
    assert.equal(result.total, 125)
  })

  it('charges the $25 flat fee for print-only file delivery', () => {
    // 100 records: below every volume-discount tier, so the fee is undiscounted.
    const result = calculatePricing({ serviceLevel: 'print_only' }, 100)
    assert.equal(result.printing, 25.00)
    assert.equal(result.total, 25.00)
  })

  it('adds the $15 shipping base for ship_processed', () => {
    const result = calculatePricing(
      { serviceLevel: 'ship_processed', mailPieceFormat: 'letter_8_5x11', paperStock: 'standard_14pt', finish: 'matte' },
      100
    )
    // shipping = 1500 + 2×100 = 1700 cents = $17.00
    assert.equal(result.shipping, 17.00)
  })
})
