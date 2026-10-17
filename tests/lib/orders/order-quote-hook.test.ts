import { strict as assert } from 'assert'
import { act } from 'react'
import { renderHook, cleanup, waitFor } from '@testing-library/react'
import { installReactDom } from '../../helpers/react-dom'
import { finalPricing, orderFixture } from '../../helpers/client-order-fixture'
import { useOrderQuote } from '../../../components/orders/quotes/use-order-quote'
import type { OrderState } from '../../../types/orders'

describe('order quote requests', () => {
  let restoreDom: () => void
  let restoreFetch: typeof fetch
  beforeEach(() => { restoreDom = installReactDom(); restoreFetch = globalThis.fetch })
  afterEach(() => { cleanup(); globalThis.fetch = restoreFetch; restoreDom() })
  it('posts canonical state and ignores pricing-only updates without a fetch loop', async () => {
    const calls: unknown[] = []
    globalThis.fetch = (async (_url, init) => { calls.push(JSON.parse(String(init?.body))); return Response.json(finalPricing) }) as typeof fetch
    const updates: Partial<OrderState>[] = []
    const state = orderFixture()
    const view = renderHook(({ value }) => useOrderQuote(value, update => updates.push(update)), { initialProps: { value: state } })
    await waitFor(() => assert.equal(view.result.current.pricing?.quoteRevision, 'quote-a'))
    assert.deepEqual(calls[0], { orderState: JSON.parse(JSON.stringify(state)) })
    view.rerender({ value: { ...state, pricing: { ...finalPricing }, updatedAt: new Date() } })
    assert.equal(calls.length, 1)
    assert.ok(updates.some(update => update.pricing?.quoteRevision === 'quote-a'))
  })
  it('discards an older quote after artwork/options change', async () => {
    const pending: Array<(value: Response) => void> = []
    globalThis.fetch = (() => new Promise<Response>(resolve => pending.push(resolve))) as typeof fetch
    const updates: Partial<OrderState>[] = []
    const state = orderFixture()
    const view = renderHook(({ value }) => useOrderQuote(value, update => updates.push(update)), { initialProps: { value: state } })
    view.rerender({ value: { ...state, mailingOptions: { ...state.mailingOptions!, finish: 'gloss' } } })
    assert.equal(view.result.current.pricing, undefined)
    await act(async () => { pending[1](Response.json({ ...finalPricing, quoteRevision: 'new-quote' })); pending[0](Response.json(finalPricing)) })
    await waitFor(() => assert.equal(view.result.current.pricing?.quoteRevision, 'new-quote'))
    assert.equal(updates.some(update => update.pricing?.quoteRevision === 'quote-a'), false)
  })
})

import { useQuotedIntent } from '../../../components/orders/quotes/use-quoted-intent'
describe('quoted intent requests', () => {
  let restoreDom: () => void
  let restoreFetch: typeof fetch
  beforeEach(() => { restoreDom = installReactDom(); restoreFetch = globalThis.fetch })
  afterEach(() => { cleanup(); globalThis.fetch = restoreFetch; restoreDom() })
  it('does not create a payment intent for provisional estimates', async () => {
    let calls = 0
    globalThis.fetch = (async () => { calls++; return Response.json({}) }) as typeof fetch
    renderHook(() => useQuotedIntent(orderFixture(), { ...finalPricing, quoteStatus: 'provisional' }, () => undefined, () => undefined))
    await act(async () => undefined)
    assert.equal(calls, 0)
  })
  it('retains the server intent quote and ignores an older intent response', async () => {
    const pending: Array<(value: Response) => void> = []
    const requests: Array<Record<string, unknown>> = []
    globalThis.fetch = ((_url, init) => { requests.push(JSON.parse(String(init?.body))); return new Promise<Response>(resolve => pending.push(resolve)) }) as typeof fetch
    const state = orderFixture()
    const updates: Partial<OrderState>[] = []
    const view = renderHook(({ value, pricing }) => useQuotedIntent(value, pricing, update => updates.push(update), () => undefined), { initialProps: { value: state, pricing: finalPricing } })
    const newer = { ...finalPricing, quoteRevision: 'new' }
    view.rerender({ value: { ...state, mailingOptions: { ...state.mailingOptions!, finish: 'gloss' }, proofQuoteRevision: 'new', approval: { ...state.approval!, quoteRevision: 'new' } }, pricing: newer })
    const response = (pricing: typeof finalPricing, id: string) => Response.json({ paymentIntentId: id, clientSecret: 'secret', quoteRevision: pricing.quoteRevision, amount: pricing.totalPrice, pricing })
    await act(async () => { pending[1](response(newer, 'pi-new')); pending[0](response(finalPricing, 'pi-old')) })
    assert.equal(view.result.current.payment?.paymentIntentId, 'pi-new')
    assert.equal(view.result.current.payment?.quoteRevision, 'new')
    assert.equal(requests[0].amount, undefined)
    assert.equal(updates.some(update => update.payment?.paymentIntentId === 'pi-old'), false)
  })
})

import { useOrderProof } from '../../../components/orders/quotes/use-order-proof'
describe('quoted proof readiness', () => {
  let restoreDom: () => void
  let restoreFetch: typeof fetch
  beforeEach(() => { restoreDom = installReactDom(); restoreFetch = globalThis.fetch })
  afterEach(() => { cleanup(); globalThis.fetch = restoreFetch; restoreDom() })
  it('binds proof readiness to the current quote and ignores an older proof', async () => {
    const pending: Array<(value: Response) => void> = []
    globalThis.fetch = (() => new Promise<Response>(resolve => pending.push(resolve))) as typeof fetch
    const updates: Partial<OrderState>[] = []
    const state = orderFixture()
    const view = renderHook(({ value, pricing }) => useOrderProof(value, pricing, update => updates.push(update)), { initialProps: { value: state, pricing: finalPricing } })
    const newer = { ...finalPricing, quoteRevision: 'new' }
    view.rerender({ value: { ...state, mailingOptions: { ...state.mailingOptions!, finish: 'gloss' } }, pricing: newer })
    assert.equal(view.result.current.url, undefined)
    await act(async () => { pending[1](Response.json({ proofUrl: '/new.pdf', quoteRevision: 'new' })); pending[0](Response.json({ proofUrl: '/old.pdf', quoteRevision: 'quote-a' })) })
    assert.equal(view.result.current.url, '/new.pdf')
    assert.ok(updates.some(update => update.proofQuoteRevision === 'new'))
    assert.equal(updates.some(update => update.proofQuoteRevision === 'quote-a'), false)
  })
})
