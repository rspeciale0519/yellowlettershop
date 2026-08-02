import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing } from '../../../lib/orders/pricing'

// Rates are CENTS per piece: postcard_4x6 print = 45 ($0.45), Forever stamp =
// 73 ($0.73). The previous expectations here pinned a units bug (divide by
// 1000) that priced everything 10× under — $0.073 per stamp — which Stripe
// rejected outright for small orders (amount_too_small) and silently
// undercharged large ones.
describe('calculatePricing', () => {
  it('calculates base postcard with no postage', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      100
    )
    assert.equal(result.printing, 45.00)      // 100 × $0.45
    assert.equal(result.postage, null)
    assert.equal(result.total, 45.00)
    assert.equal(result.recordCount, 100)
  })

  it('includes postage when includePostage is true', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_forever' },
      100
    )
    assert.equal(result.postage, 73.00)       // 100 × $0.73
    assert.equal(result.total, 118.00)        // $1.18/piece all-in
    assert.equal(result.pricePerPiece, 1.18)
  })

  it('prices a single postcard above the Stripe $0.50 minimum', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_forever' },
      1
    )
    assert.equal(result.total, 1.18)
    assert.ok(result.total >= 0.5, 'a 1-piece order must clear the Stripe minimum charge')
  })

  it('applies 5% volume discount at 1000+ records', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      1000
    )
    // printing = 45000 cents = $450; discount = floor(45000 × 0.05) = 2250 cents = $22.50
    assert.equal(result.printing, 450.00)
    assert.equal(result.discount, 22.50)
    assert.equal(result.total, 450.00 - 22.50)
  })

  it('falls back to first_class_forever when discounted rate requested under 200 records', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_discounted' },
      100
    )
    assert.equal(result.postage, 73.00)       // fell back to the Forever rate
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
