import { strict as assert } from 'assert'
import { beforeEach } from 'mocha'
import { loadRoute, post, resetRuntime, runtime } from '../../helpers/order-route-harness'
import { loadOrderQuote } from '../../../lib/orders/server-quote'
import { DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { artwork, quoteDatabase } from '../../helpers/quote-fixtures'

const intentRoute = loadRoute('../../app/api/payments/intent/route')
const authorizeRoute = loadRoute('../../app/api/payments/authorize/route')
const submitRoute = loadRoute('../../app/api/orders/submit/route')
const pricingRoute = loadRoute('../../app/api/orders/pricing/route')
const proofRoute = loadRoute('../../app/api/orders/proof/route')
const calculateRoute = loadRoute('../../app/api/orders/calculate-pricing/route')

describe('checkout server quote integration', () => {
  beforeEach(resetRuntime)
  it('creates a manually captured intent using server total and quote fingerprint', async () => {
    const response = await post(intentRoute, { orderState: runtime.state, amount: 0.01 })
    assert.equal(response.status, 200)
    assert.equal(runtime.created.amount, 85)
    assert.equal(runtime.created.capture_method, 'manual')
    assert.ok((runtime.created.metadata as Record<string, string>).quote_revision)
  })
  it('prevents amount-only or stale artwork payment authorization before attaching a card', async () => {
    const response = await post(authorizeRoute, { orderState: runtime.state, paymentIntentId: 'pi_test', paymentMethodId: 'pm_test' })
    assert.equal(response.status, 402)
    assert.equal(runtime.confirmed, 0)
    assert.equal(runtime.attached, 0)
    const quote = await loadOrderQuote(runtime.db, 'owner', runtime.state, DEFAULT_PRICING)
    runtime.intent.amount = quote.amountCents
    runtime.intent.metadata.quote_revision = quote.pricing.quoteRevision
    const changed = artwork(true); changed.templateName = 'Updated artwork'
    runtime.db = quoteDatabase(changed).db
    const stale = await post(authorizeRoute, { orderState: runtime.state, paymentIntentId: 'pi_test', paymentMethodId: 'pm_test' })
    assert.equal(stale.status, 409)
    assert.equal(runtime.confirmed, 0)
  })
  it('rejects client-forged submission total and freezes server snapshot on valid submission', async () => {
    const forged = await post(submitRoute, { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })
    assert.equal(forged.status, 402)
    assert.deepEqual(runtime.inserted, {})
    const quote = await loadOrderQuote(runtime.db, 'owner', runtime.state, DEFAULT_PRICING)
    runtime.intent.amount = quote.amountCents
    runtime.intent.metadata.quote_revision = quote.pricing.quoteRevision
    const response = await post(submitRoute, { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })
    assert.equal(response.status, 200)
    assert.equal(runtime.inserted.total_cost, 0.85)
    assert.equal(runtime.inserted.record_count, 1)
    const stored = runtime.inserted.metadata as { order_state: typeof quote.snapshot }
    assert.equal(stored.order_state.listData.manualRecords[0].first_name, 'Actual')
    assert.equal(stored.order_state.design.designJson.pageSettings.back.printIncluded, true)
    assert.equal(stored.order_state.pricing.quoteRevision, quote.pricing.quoteRevision)
    const payment = (stored.order_state as Record<string, unknown>).payment as { amount: number; quoteRevision: string }
    assert.equal(payment.amount, 0.85)
    assert.equal(payment.quoteRevision, quote.pricing.quoteRevision)
  })
  it('returns one authoritative quote through both pricing routes', async () => {
    const first = await post(pricingRoute, { orderState: runtime.state })
    const second = await post(calculateRoute, { orderState: runtime.state })
    assert.equal(first.status, 200)
    assert.equal(second.status, 200)
    const a = await first.json(); const b = await second.json()
    assert.equal(a.totalPrice, 0.85)
    assert.equal(a.quoteRevision, b.quoteRevision)
    assert.equal(b.quoteStatus, 'final')
    assert.equal(b.total, 0.85)
  })
  it('labels early estimates provisional and fails closed at payment', async () => {
    const state = { mailingOptions: runtime.state.mailingOptions, listData: { totalRecords: 250 } }
    const estimate = await post(pricingRoute, { orderState: state })
    assert.equal(estimate.status, 200)
    assert.equal((await estimate.json()).quoteStatus, 'provisional')
    const legacy = await post(calculateRoute, { mailingOptions: state.mailingOptions, recordCount: 250 })
    assert.equal(legacy.status, 200)
    assert.equal((await legacy.json()).quoteStatus, 'provisional')
    const payment = await post(intentRoute, { orderState: state, amount: 0.01 })
    assert.equal(payment.status, 400)
  })
  it('preserves manual authorization and requires_action handling for a matching quote', async () => {
    const quote = await loadOrderQuote(runtime.db, 'owner', runtime.state, DEFAULT_PRICING)
    runtime.intent.amount = quote.amountCents
    runtime.intent.metadata.quote_revision = quote.pricing.quoteRevision
    const body = { orderState: runtime.state, paymentIntentId: 'pi_test', paymentMethodId: 'pm_test' }
    const authorized = await post(authorizeRoute, body)
    assert.equal(authorized.status, 200)
    assert.equal((await authorized.json()).status, 'succeeded')
    assert.equal(runtime.confirmed, 1)
    runtime.intent.status = 'requires_action'
    const action = await post(authorizeRoute, body)
    assert.equal((await action.json()).status, 'requires_action')
    assert.equal(runtime.confirmed, 2)
  })
  it('rejects stale final submission before creating an order', async () => {
    const quote = await loadOrderQuote(runtime.db, 'owner', runtime.state, DEFAULT_PRICING)
    runtime.intent.amount = quote.amountCents
    runtime.intent.metadata.quote_revision = quote.pricing.quoteRevision
    const changed = artwork(true); changed.templateName = 'Changed after authorization'
    runtime.db = quoteDatabase(changed).db
    const response = await post(submitRoute, { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })
    assert.equal(response.status, 409)
    assert.deepEqual(runtime.inserted, {})
  })

  it('renders review proof from the verified snapshot and binds its quote revision', async () => {
    const quote = await loadOrderQuote(runtime.db, 'owner', runtime.state, DEFAULT_PRICING)
    const response = await post(proofRoute, { orderState: runtime.state, quoteRevision: quote.pricing.quoteRevision })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).quoteRevision, quote.pricing.quoteRevision)
    const list = runtime.rendered.listData as { manualRecords: Array<{ first_name: string }> }
    assert.equal(list.manualRecords.length, 1)
    assert.equal(list.manualRecords[0].first_name, 'Actual')
    const stale = await post(proofRoute, { orderState: runtime.state, quoteRevision: 'stale' })
    assert.equal(stale.status, 409)
  })

  it('rejects payment when larger postcard pricing has not been configured', async () => {
    const doc = artwork(true); doc.formatId = 'postcard_6x9'
    runtime.db = quoteDatabase(doc).db
    const state = { ...runtime.state, mailingOptions: { ...runtime.state.mailingOptions, mailPieceFormat: 'postcard_6x9' } }
    const response = await post(intentRoute, { orderState: state })
    assert.equal(response.status, 422)
    assert.match((await response.json()).error, /Pricing not configured for postcard_6x9/)
    assert.deepEqual(runtime.created, {})
  })

})
