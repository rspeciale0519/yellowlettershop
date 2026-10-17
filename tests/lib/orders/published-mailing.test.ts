import { strict as assert } from 'assert'
import { calculatePricing, DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { loadOrderQuote } from '../../../lib/orders/server-quote'
import { toPricingBreakdown } from '../../../lib/orders/pricing-breakdown'
import { normalizeFullServiceOptions } from '../../../lib/orders/published-mailing'
import { artwork, quoteDatabase, quoteState } from '../../helpers/quote-fixtures'

// Customer-facing price contract captured from yellowlettershop.com on 2026-10-17.
// Expectations are mailing totals, including postage and the published volume rate.
describe('published mailing prices', () => {
  const postcard = { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', includePostage: true, postageType: 'first_class_forever' } as const
  for (const [quantity, cents] of [[1,125],[249,125],[250,91],[499,91],[500,88],[749,88],[750,84],[999,84],[1000,76],[2499,76],[2500,75],[4999,75],[5000,72],[9999,72],[10000,70]] as const) {
    it(`charges the advertised 4x6 First Class total at ${quantity} pieces`, () => {
      const result = calculatePricing(postcard, quantity)
      assert.equal(Math.round(result.total * 100), quantity * cents)
      assert.equal(result.postage, null, 'published price already includes postage')
      assert.equal(result.discount, null, 'published tiers must not receive another volume discount')
    })
  }
  it('uses the published First Class fallback below 250 postcards, including 200–249', () => {
    for (const quantity of [1,199,200,249]) {
      const result = calculatePricing({ ...postcard, postageType: 'standard' }, quantity)
      assert.equal(Math.round(result.total * 100), quantity * 125)
    }
    assert.equal(calculatePricing({ ...postcard, postageType: 'standard' }, 250).total, 230)
  })
  it('uses the explicitly published small-letter Standard rate', () => {
    assert.equal(calculatePricing({ ...postcard, mailPieceFormat: 'letter_8_5x11', postageType: 'standard' }, 1).total, 1.15)
    assert.equal(calculatePricing({ ...postcard, mailPieceFormat: 'letter_8_5x11', postageType: 'standard' }, 250).total, 275)
  })
  it('uses the published letter table for full-size and folded letters', () => {
    for (const mailPieceFormat of ['letter_8_5x11','letter_folded'] as const) {
      assert.equal(calculatePricing({ ...postcard, mailPieceFormat }, 1).total, 1.70)
      assert.equal(calculatePricing({ ...postcard, mailPieceFormat }, 1000).total, 1230)
    }
  })
  it('prices both existing First Class selections from the same published FC column', () => {
    assert.equal(calculatePricing({ ...postcard, postageType: 'first_class_discounted' }, 500).total, 440)
  })
  it('preserves the chosen First Class permit method for fulfillment', () => {
    const normalized = normalizeFullServiceOptions({ ...postcard, postageType: 'first_class_discounted' as const }, 500)
    assert.equal(normalized.postageType, 'first_class_discounted')
    assert.equal(normalized.includePostage, true)
  })
  it('cannot remove postage from a full-service total by changing a browser flag', () => {
    assert.equal(calculatePricing({ ...postcard, includePostage: false }, 1000).total, 760)
  })
  it('adds exactly ten cents per additional printed letter side without discounting that fee', () => {
    const result = calculatePricing({ ...postcard, mailPieceFormat: 'letter_8_5x11' }, 1000, DEFAULT_PRICING, { printedSideCount: 3, includedPrintedSides: 1 })
    assert.equal(result.additionalSideChargeCents, 20000)
    assert.equal(result.total, 1430)
    assert.equal(result.discount, null)
  })
  it('supports all published postcard sizes without unrelated legacy print rates', () => {
    for (const [format, cents] of [['postcard_4x6',76],['postcard_5x7',82],['postcard_6x9',83],['postcard_6x11',85]] as const) {
      assert.equal(calculatePricing({ ...postcard, mailPieceFormat: format }, 1000).total, cents * 10)
    }
  })
  it('labels the order base charge as including postage', () => {
    const result = toPricingBreakdown(calculatePricing(postcard, 250))
    assert.match(result.basePriceLabel ?? '', /postage included/i)
    assert.equal(result.postageCharges, 0)
    assert.equal(result.addOnServices.length, 0)
  })
  it('stores the actual required mailing class and included postage in the authoritative snapshot', async () => {
    const design = artwork(true); design.formatId = 'postcard_6x9'
    const quote = await loadOrderQuote(quoteDatabase(design).db, 'owner', {
      ...quoteState,
      mailingOptions: { ...postcard, mailPieceFormat: 'postcard_6x9', postageType: 'standard', includePostage: false },
    }, DEFAULT_PRICING)
    assert.equal(quote.amountCents, 128)
    assert.equal(quote.snapshot.mailingOptions.includePostage, true)
    assert.equal(quote.snapshot.mailingOptions.postageType, 'first_class_forever')
    assert.equal(quote.snapshot.campaignSettings.mailingOptions.postageType, 'first_class_forever')
  })
})
