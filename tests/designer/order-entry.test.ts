import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { persistOrderForDesigner } from '../../lib/designer/order-entry'
describe('order persistence before opening the designer', () => {
  it('saves the latest state for an existing order instead of reopening stale server details', async () => {
    const state = { orderId: 'existing-order', step: 3, contactCard: { contactCardId: 'new-sender' } }
    let received: unknown
    const id = await persistOrderForDesigner(state, async (_url, options) => {
      received = JSON.parse(String(options?.body))
      return new Response(JSON.stringify({ orderId: state.orderId }))
    })
    assert.equal(id, state.orderId)
    assert.deepEqual(received, { orderId: state.orderId, orderState: state })
  })
  it('does not open a draft when persistence fails or returns a different order', async () => {
    await assert.rejects(persistOrderForDesigner({ orderId: 'existing' }, async () => new Response('{}', { status: 503 })))
    await assert.rejects(persistOrderForDesigner({ orderId: 'existing' }, async () => new Response(JSON.stringify({ orderId: 'other' }))))
  })
})
