import { strict as assert } from 'assert'
import { loadRoute, post, resetRuntime, runtime } from '../helpers/order-route-harness'
import { quoteDatabase, artwork } from '../helpers/quote-fixtures'

for (const path of ['../../app/api/payments/intent/route', '../../app/api/payments/create-payment-intent/route']) {
  const route = loadRoute(path)
  describe(`authoritative payment endpoint ${path}`, () => {
    beforeEach(() => resetRuntime())
    it('ignores forged browser amounts, recipient counts, currency and metadata', async () => {
      const response = await post(route, {
        orderState: { ...runtime.state, validatedQuantity: 999999, recordCount: 999999 },
        amount: 50, recordCount: 999999, currency: 'eur', description: 'Forged',
        metadata: { user_id: 'attacker', record_count: '999999', quote_revision: 'fake' },
      })
      assert.equal(response.status, 200)
      assert.equal(runtime.created.amount, 148)
      assert.equal(runtime.created.currency, 'usd')
      const metadata = runtime.created.metadata as Record<string, string>
      assert.equal(metadata.user_id, 'owner')
      assert.equal(metadata.record_count, '1')
      assert.notEqual(metadata.quote_revision, 'fake')
    })
    it('rejects amount-only requests without contacting Stripe', async () => {
      const response = await post(route, { amount: 50, description: 'Forged', recordCount: 1 })
      assert.equal(response.status, 400)
      assert.deepEqual(runtime.created, {})
    })
    it('rejects unowned, incomplete and inconsistent stored validation', async () => {
      const fixtures = [[quoteDatabase(artwork(), 'other').db, 404], [quoteDatabase(artwork(), 'owner', 1, 'processing').db, 404], [quoteDatabase(artwork(), 'owner', 999).db, 400]] as const
      for (const [db, expectedStatus] of fixtures) {
        runtime.db = db
        const response = await post(route, { orderState: runtime.state, amount: 50, description: 'Forged' })
        assert.equal(response.status, expectedStatus)
        assert.deepEqual(runtime.created, {})
      }
    })
  })
}
