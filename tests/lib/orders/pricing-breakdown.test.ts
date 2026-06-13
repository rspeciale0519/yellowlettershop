import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing } from '../../../lib/orders/pricing'
import { toPricingBreakdown } from '../../../lib/orders/pricing-breakdown'

describe('toPricingBreakdown', () => {
  it('maps total/printing/pricePerPiece onto the UI breakdown shape', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
      100
    )
    const b = toPricingBreakdown(result)

    assert.equal(b.totalPrice, result.total)
    assert.equal(b.basePrice, result.printing)
    assert.equal(b.pricePerPiece, result.pricePerPiece)
    assert.equal(b.taxAmount, 0)
  })

  it('maps null postage/shipping to zero charges', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
      100
    )
    assert.equal(result.postage, null)
    const b = toPricingBreakdown(result)
    assert.equal(b.postageCharges, 0)
    assert.equal(b.shippingCharges, 0)
  })

  it('carries postage and shipping dollars through when present', () => {
    const withPostage = toPricingBreakdown(
      calculatePricing(
        {
          serviceLevel: 'full_service',
          mailPieceFormat: 'postcard_4x6',
          includePostage: true,
          postageType: 'first_class_forever',
        },
        100
      )
    )
    assert.ok(withPostage.postageCharges > 0)

    const shipped = toPricingBreakdown(
      calculatePricing(
        { serviceLevel: 'ship_processed', mailPieceFormat: 'postcard_4x6' },
        100
      )
    )
    assert.ok(shipped.shippingCharges > 0)
  })

  it('surfaces a volume discount as a negative add-on line item', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
      1000
    )
    assert.ok(result.discount && result.discount > 0)
    const b = toPricingBreakdown(result)

    assert.equal(b.addOnServices.length, 1)
    const line = b.addOnServices[0]
    assert.equal(line.id, 'volume_discount')
    assert.equal(line.totalPrice, -(result.discount as number))
    assert.equal(b.totalPrice, result.total)
  })

  it('produces no add-on lines when there is no discount', () => {
    const b = toPricingBreakdown(
      calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
        100
      )
    )
    assert.deepEqual(b.addOnServices, [])
  })
})
