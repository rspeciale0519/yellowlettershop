import { strict as assert } from 'assert'
import { calculatePricing } from '../../../lib/orders/pricing'
import { buildPricingConfig, type PricingRow } from '../../../lib/orders/pricing-config-data'

const options = { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', includePostage: true, postageType: 'first_class_forever' } as const
const row = (tier_config: unknown): PricingRow => ({ category: 'mail_piece', key: 'published_postcard_4x6_fc', pricing_model: 'tiered', unit_amount: null, tier_config, metadata: null, is_active: true })

describe('published mailing configuration', () => {
  it('keeps legacy print/postage/discount overrides out of bundled mailing totals', () => {
    const common = { metadata: null, is_active: true }
    const config = buildPricingConfig([
      { ...common, category: 'mail_piece', key: 'postcard_4x6', unit_amount: 1, tier_config: null },
      { ...common, category: 'postage', key: 'first_class_forever', unit_amount: 1, tier_config: null },
      { ...common, category: 'volume_discount', key: 'printing', unit_amount: null, tier_config: [{ min: 1, price: 99 }] },
    ])
    assert.equal(calculatePricing(options, 250, config).total, 227.5)
  })
  it('uses explicit admin mailing tiers without mutating published defaults', () => {
    const config = buildPricingConfig([row([{ min: 1, max: 249, price: 130 }, { min: 250, max: null, price: 95 }])])
    assert.equal(calculatePricing(options, 249, config).total, 323.7)
    assert.equal(calculatePricing(options, 250, config).total, 237.5)
    assert.equal(calculatePricing(options, 250).total, 227.5)
  })
  it('rejects incomplete, overlapping or non-cent admin tables instead of quoting a wrong fallback', () => {
    for (const tiers of [
      [], [{ min: 2, max: null, price: 100 }],
      [{ min: 1, max: 249, price: 100 }],
      [{ min: 1, max: 249, price: 100 }, { min: 249, max: null, price: 90 }],
      [{ min: 1, max: 249, price: 100 }, { min: 251, max: null, price: 90 }],
      [{ min: 1, max: null, price: 0.99 }], [{ min: 1, max: null, price: -1 }],
    ]) assert.throws(() => buildPricingConfig([row(tiers)]), /published mailing/i)
  })
  it('ignores inactive entries and requires a tiered model for explicit mailing overrides', () => {
    assert.equal(calculatePricing(options, 250, buildPricingConfig([{ ...row([]), is_active: false }])).total, 227.5)
    assert.throws(() => buildPricingConfig([{ ...row([]), pricing_model: 'flat', unit_amount: 1 }]), /tiered/i)
  })
})
