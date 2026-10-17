import { strict as assert } from 'assert'
import { loadRoute, post, resetRuntime, runtime } from '../helpers/order-route-harness'

const intent = loadRoute('../../app/api/payments/intent/route')
const submit = loadRoute('../../app/api/orders/submit/route')

describe('PaymentIntent reuse', () => {
  beforeEach(() => resetRuntime())

  async function authorizeQuote() {
    const response = await post(intent, { orderState: runtime.state })
    assert.equal(response.status, 200)
    runtime.intent.amount = runtime.created.amount as number
    runtime.intent.metadata = { ...(runtime.created.metadata as Record<string, string>) }
    return runtime.created.metadata as Record<string, string>
  }

  it('binds Stripe create to a per-user plus quote idempotency key', async () => {
    const metadata = await authorizeQuote()
    assert.equal(runtime.idempotencyKey, `checkout:owner:${metadata.quote_revision}`)
  })

  it('rejects the same authorized PaymentIntent on a second submit with 409', async () => {
    await authorizeQuote()
    const body = { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } }
    assert.equal((await post(submit, body)).status, 200)
    assert.equal(runtime.intent.metadata.order_id, 'order-test')
    const second = await post(submit, body)
    assert.equal(second.status, 409)
    assert.match((await second.json()).error, /already been used/)
  })

  it('returns 409 when the payment intent is already stored on an order', async () => {
    await authorizeQuote()
    runtime.ordersByPi.pi_test = { id: 'existing-order' }
    const second = await post(submit, { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })
    assert.equal(second.status, 409)
    assert.deepEqual(runtime.inserted, {})
  })

  it('returns 409 when the unique constraint rejects a racing insert', async () => {
    await authorizeQuote()
    runtime.ordersByPi.pi_test = { id: 'existing-order' }
    const originalMaybe = runtime.db.from
    // Force the pre-check to miss so insert hits 23505.
    runtime.db.from = ((table: string) => {
      const query = originalMaybe.call(runtime.db, table) as { maybeSingle?: () => Promise<unknown> }
      if (table === 'orders' && query.maybeSingle) {
        query.maybeSingle = async () => ({ data: null, error: null })
      }
      return query
    }) as typeof runtime.db.from
    const response = await post(submit, { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })
    assert.equal(response.status, 409)
  })
})
