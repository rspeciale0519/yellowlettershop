import { strict as assert } from 'assert'
import { orderFixture } from '../../helpers/client-order-fixture'
import { authorizeQuotedOrder } from '../../../components/orders/quotes/authorize-quoted-order'

describe('client quoted payment flow', () => {
  it('passes the just-authorized payment explicitly to submission', async () => {
    const state = orderFixture()
    let override: unknown
    const result = await authorizeQuotedOrder({ state, payment: { ...state.payment!, status: 'pending' }, methodId: 'pm-new', isCurrent: () => true, authorize: async () => ({ status: 'succeeded' }), update: () => undefined, submit: async updates => { override = updates; return { success: true, orderId: 'order-new' } } })
    assert.equal(result.orderId, 'order-new')
    assert.equal((override as { payment: { status: string; paymentMethodId: string } }).payment.status, 'authorized')
    assert.equal((override as { payment: { status: string; paymentMethodId: string } }).payment.paymentMethodId, 'pm-new')
  })
  it('does not submit if production inputs change during authorization', async () => {
    const state = orderFixture(); let current = true; let submitted = false
    await assert.rejects(authorizeQuotedOrder({ state, payment: state.payment!, methodId: 'pm', isCurrent: () => current, authorize: async () => { current = false; return { status: 'succeeded' } }, update: () => undefined, submit: async () => { submitted = true; return { success: true } } }))
    assert.equal(submitted, false)
  })
  it('blocks provisional or stale intent/approval before calling authorize', async () => {
    const state = orderFixture(); let called = false
    await assert.rejects(authorizeQuotedOrder({ state, payment: { ...state.payment!, quoteRevision: 'old' }, methodId: 'pm', isCurrent: () => true, authorize: async () => { called = true; return { status: 'succeeded' } }, update: () => undefined, submit: async () => ({ success: true }) }))
    assert.equal(called, false)
  })
})
