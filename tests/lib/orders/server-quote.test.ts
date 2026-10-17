import { strict as assert } from 'assert'
import { artwork, quoteState as state, quoteDatabase as database } from '../../helpers/quote-fixtures'
import { DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { loadOrderQuote, assertQuotePayment, provisionalOrderQuote } from '../../../lib/orders/server-quote'

describe('authoritative server quote', () => {
  it('ignores tampered totals/rates/counts and freezes actual deliverable recipients', async () => {
    const { db, calls } = database()
    const quote = await loadOrderQuote(db, 'owner', state, DEFAULT_PRICING)
    assert.equal(quote.amountCents, 85)
    assert.equal(quote.pricing.validatedQuantity, 1)
    assert.equal(quote.pricing.quoteStatus, 'final')
    assert.equal(quote.pricing.additionalSideChargeCents, 10)
    assert.equal(quote.snapshot.listData.totalRecords, 1)
    assert.equal(quote.snapshot.listData.selectedListId, undefined)
    assert.equal(quote.snapshot.listData.manualRecords[0].first_name, 'Actual')
    assert.equal(quote.snapshot.design.designJson.pageOrder.length, 2)
    assert.ok(calls.some(([table,key,value]) => table === 'saved_designs' && key === 'user_id' && value === 'owner'))
    assert.ok(calls.some(([table,key,value]) => table === 'accuzip_validation_jobs' && key === 'user_id' && value === 'owner'))
  })
  it('fails closed on unknown or unowned IDs, incomplete jobs and inconsistent job counts', async () => {
    for (const db of [database(artwork(), 'other').db, database(artwork(), 'owner', 1, 'processing').db, database(artwork(), 'owner', 1000).db]) {
      await assert.rejects(loadOrderQuote(db, 'owner', state, DEFAULT_PRICING))
    }
    await assert.rejects(loadOrderQuote(database().db, 'owner', { ...state, design: { designId: 'unknown' } }, DEFAULT_PRICING))
    await assert.rejects(loadOrderQuote(database().db, 'owner', { ...state, addressValidation: { orderId: 'unknown' } }, DEFAULT_PRICING))
  })
  it('rejects ambiguous design and validation references', async () => {
    await assert.rejects(loadOrderQuote(database().db, 'owner', { ...state, designAndContent: { design: { designId: 'other' } } }, DEFAULT_PRICING))
    await assert.rejects(loadOrderQuote(database().db, 'owner', { ...state, accuzipValidation: { orderId: 'other' } }, DEFAULT_PRICING))
  })
  it('rejects stale artwork even at identical amount and side count', async () => {
    const before = await loadOrderQuote(database().db, 'owner', state, DEFAULT_PRICING)
    const changed = artwork(true)
    changed.templateName = 'Changed artwork'
    const after = await loadOrderQuote(database(changed).db, 'owner', state, DEFAULT_PRICING)
    assert.equal(before.amountCents, after.amountCents)
    assert.notEqual(before.pricing.designRevision, after.pricing.designRevision)
    const payment = { amount: before.amountCents, currency: 'usd', capture_method: 'manual', metadata: { user_id: 'owner', quote_revision: before.pricing.quoteRevision! } }
    assert.doesNotThrow(() => assertQuotePayment(payment, before, 'owner'))
    assert.throws(() => assertQuotePayment(payment, after, 'owner'))
    assert.throws(() => assertQuotePayment({ ...payment, amount: 1 }, before, 'owner'))
    assert.throws(() => assertQuotePayment({ ...payment, metadata: { ...payment.metadata, user_id: 'other' } }, before, 'owner'))
    assert.throws(() => assertQuotePayment({ ...payment, metadata: { user_id: 'owner' } }, before, 'owner'))
  })
  it('requires saved design and completed validation for payment', async () => {
    await assert.rejects(loadOrderQuote(database().db, 'owner', { mailingOptions: state.mailingOptions }, DEFAULT_PRICING))
  })
  it('estimates explicit blank sides provisionally before validation is available', () => {
    const estimate = provisionalOrderQuote({ mailingOptions: state.mailingOptions, listData: { totalRecords: 250 }, design: { designJson: artwork(true) } }, DEFAULT_PRICING)
    assert.equal(estimate.pricing.quoteStatus, 'provisional')
    assert.equal(estimate.pricing.additionalSideChargeCents, 2500)
    assert.equal(estimate.pricing.totalPrice, 212.5)
  })
  it('rejects unsaved client artwork or stale save receipt against the stored revision', async () => {
    const changed = artwork(true); changed.templateName = 'Unsaved changes'
    await assert.rejects(loadOrderQuote(database().db, 'owner', { ...state, design: { ...state.design, designJson: changed } }, DEFAULT_PRICING))
    await assert.rejects(loadOrderQuote(database().db, 'owner', { ...state, design: { ...state.design, designRevision: 'sha256:stale' } }, DEFAULT_PRICING))
  })
  it('accepts undeliverable records with incomplete addresses without mailing them', async () => {
    const fixture = database()
    const records = fixture.rows.accuzip_validation_jobs.validated_records as unknown[]
    records.push({ id: 'bad', is_deliverable: false, standardized_address: { address_line_1: '', city: '', state: '', zip: '' } })
    const quote = await loadOrderQuote(fixture.db, 'owner', state, DEFAULT_PRICING)
    assert.equal(quote.pricing.validatedQuantity, 1)
    assert.equal(quote.snapshot.listData.manualRecords.length, 1)
  })
  it('binds recipients and fulfillment options even at the same amount', async () => {
    const before = await loadOrderQuote(database().db, 'owner', state, DEFAULT_PRICING)
    const fixture = database()
    const records = fixture.rows.accuzip_validation_jobs.validated_records as Array<Record<string, unknown>>
    records[0].first_name = 'Different recipient'
    const after = await loadOrderQuote(fixture.db, 'owner', state, DEFAULT_PRICING)
    const options = await loadOrderQuote(database().db, 'owner', { ...state, campaignSettings: { scheduledStartDate: '2027-01-01' } }, DEFAULT_PRICING)
    assert.equal(before.amountCents, after.amountCents)
    assert.notEqual(before.pricing.quoteRevision, after.pricing.quoteRevision)
    assert.notEqual(before.pricing.quoteRevision, options.pricing.quoteRevision)
    const legacyCampaign = await loadOrderQuote(database().db, 'owner', { ...state, campaignOptions: { isRepeating: true, repeatConfig: { repetitions: 2 } } }, DEFAULT_PRICING)
    assert.notEqual(before.pricing.quoteRevision, legacyCampaign.pricing.quoteRevision)
  })

})
