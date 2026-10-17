import { strict as assert } from 'assert'
import { loadRoute, post, resetRuntime, runtime } from '../helpers/order-route-harness'
const intent = loadRoute('../../app/api/payments/intent/route')
const authorize = loadRoute('../../app/api/payments/authorize/route')
const submit = loadRoute('../../app/api/orders/submit/route')

describe('main wizard payment/recipient security binding', () => {
  beforeEach(() => resetRuntime())
  async function quotedIntent() {
    const r = await post(intent, { orderState: runtime.state, amount: 0.01 })
    assert.equal(r.status, 200)
    runtime.intent.amount = runtime.created.amount as number
    runtime.intent.metadata = runtime.created.metadata as Record<string, string>
  }
  it('keeps main pricing and the existing local-artwork wizard while ignoring browser price/count', async () => {
    await quotedIntent()
    assert.equal(runtime.intent.amount, 148)
    assert.equal(runtime.intent.metadata.record_count, '1')
  })
  it('rejects amount or recipient tampering before attaching/confirming a card', async () => {
    await quotedIntent(); runtime.intent.amount = 1
    assert.equal((await post(authorize, { orderState: runtime.state, paymentIntentId: 'pi_test', paymentMethodId: 'pm_test' })).status, 402)
    assert.equal(runtime.attached, 0); assert.equal(runtime.confirmed, 0)
  })
  it('uses the proof renderer’s legacy letter fallback instead of charging for a cheaper postcard', async () => {
    const state = { ...runtime.state, design: { designJson: { pages: { front: [], back: [] } } }, mailingOptions: { ...runtime.state.mailingOptions, mailPieceFormat: 'postcard_4x6' } }
    assert.equal((await post(intent, { orderState: state })).status, 400)
    assert.deepEqual(runtime.created, {})
  })
  it('freezes actual validated recipients and total at submit even when browser pricing is forged', async () => {
    await quotedIntent()
    const state = { ...runtime.state, payment: { paymentIntentId: 'pi_test' } }
    assert.equal((await post(submit, { orderState: state })).status, 200)
    assert.equal(runtime.inserted.total_cost, 1.48)
    assert.equal(runtime.inserted.record_count, 1)
    const saved = (runtime.inserted.metadata as { order_state: Record<string, any> }).order_state
    assert.equal(saved.listData.manualRecords[0].first_name, 'Actual')
    assert.equal(saved.listData.selectedListId, undefined)
    assert.equal(saved.dataAndMapping.listData.selectedListId, undefined)
  })
  it('allows a matching manual authorization but rejects different recipients at the same price', async () => {
    await quotedIntent()
    assert.equal((await post(authorize, { orderState: runtime.state, paymentIntentId: 'pi_test', paymentMethodId: 'pm_test' })).status, 200)
    assert.equal(runtime.confirmed, 1)
    const from = runtime.db.from.bind(runtime.db)
    runtime.db.from = ((table: string) => {
      if (table !== 'accuzip_validation_jobs') return from(table)
      const q = { select: () => q, eq: () => q, maybeSingle: async () => q.single(), single: async () => ({ data: { id: '33333333-3333-4333-8333-333333333333', user_id: 'owner', status: 'completed', deliverable_count: 1, validated_records: [{ first_name: 'Changed', is_deliverable: true, standardized_address: { address_line_1: '456 Main', city: 'Austin', state: 'TX', zip: '78701' } }] }, error: null }) }
      return q
    }) as typeof runtime.db.from
    assert.equal((await post(submit, { orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })).status, 409)
    assert.deepEqual(runtime.inserted, {})
  })
})
