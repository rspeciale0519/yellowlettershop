import { strict as assert } from 'assert'
import { calculatePricing, DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { buildPricingConfig, type PricingRow } from '../../../lib/orders/pricing-config-data'
import { getProductPrintPolicy } from '../../../lib/orders/additional-side-pricing'
import { loadOrderQuote } from '../../../lib/orders/server-quote'
import { artwork, quoteDatabase, quoteState } from '../../helpers/quote-fixtures'

function row(key: string, amount: number): PricingRow { return { category: 'mail_piece', key, unit_amount: amount, is_active: true, tier_config: null, metadata: null } }
describe('configured larger postcards', () => {
  it('recognizes fixed two-sided 6x9 and 6x11 policy without inventing rates', () => {
    for (const format of ['postcard_6x9', 'postcard_6x11']) {
      assert.equal(getProductPrintPolicy(format).includedPrintedSides, 2)
      assert.equal(getProductPrintPolicy(format).allowAdditionalPages, false)
      assert.equal(DEFAULT_PRICING.printing[format], undefined)
    }
  })
  it('loads explicitly configured admin cents and keeps defaults immutable', () => {
    const config = buildPricingConfig([row('postcard_6x9', 89), row('postcard_6x11', 109)])
    assert.equal(config.printing.postcard_6x9, 89)
    assert.equal(config.printing.postcard_6x11, 109)
    assert.equal(DEFAULT_PRICING.printing.postcard_6x9, undefined)
  })
  it('fails with an actionable error if the selected format has no configured rate', async () => {
    for (const format of ['postcard_6x9', 'postcard_6x11'] as const) {
      const doc = artwork(true); doc.formatId = format
      await assert.rejects(loadOrderQuote(quoteDatabase(doc).db, 'owner', { ...quoteState, mailingOptions: { ...quoteState.mailingOptions, mailPieceFormat: format } }, DEFAULT_PRICING), new RegExp(`Pricing not configured for ${format}`))
      assert.throws(() => calculatePricing({ serviceLevel: 'full_service', mailPieceFormat: format }, 100), new RegExp(`Pricing not configured for ${format}`))
    }
  })
  it('quotes actual saved 6x9 and 6x11 artwork at configured base rates and no extra-side fee', async () => {
    for (const [format, rate] of [['postcard_6x9', 89], ['postcard_6x11', 109]] as const) {
      const doc = artwork(true); doc.formatId = format
      const config = buildPricingConfig([row(format, rate)])
      const quote = await loadOrderQuote(quoteDatabase(doc).db, 'owner', { ...quoteState, mailingOptions: { ...quoteState.mailingOptions, mailPieceFormat: format } }, config)
      assert.equal(quote.amountCents, rate)
      assert.equal(quote.pricing.printedSideCount, 2)
      assert.equal(quote.pricing.additionalSideChargeCents, 0)
      assert.equal(quote.pricing.quoteStatus, 'final')
    }
  })
})
