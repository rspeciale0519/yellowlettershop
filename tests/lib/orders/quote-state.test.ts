import { strict as assert } from 'assert'
import type { OrderState } from '../../../types/orders'
import { applyOrderUpdate, orderQuoteKey, isFinalOrderQuote, isPaymentForQuote, approvalMatchesQuote } from '../../../lib/orders/quote-state'

import { finalPricing, orderFixture } from '../../helpers/client-order-fixture'
describe('order quote state', () => {
  it('ignores pricing, payment, approval, navigation and save-only timestamps in the request key', () => {
    const before = orderFixture()
    const after = { ...before, pricing: undefined, payment: undefined, approval: undefined, step: 2, updatedAt: new Date(), lastSaved: new Date() }
    assert.equal(orderQuoteKey(before), orderQuoteKey(after))
    after.design = { ...before.design!, designJson: { ...before.design!.designJson, updatedAt: new Date().toISOString() } }
    assert.equal(orderQuoteKey(before), orderQuoteKey(after))
  })
  it('invalidates pricing, payment and approval immediately on meaningful inputs', () => {
    const state = orderFixture()
    for (const updates of [
      { design: { ...state.design!, designRevision: 'sha256:new' } },
      { design: { ...state.design!, designJson: { ...state.design!.designJson, templateName: 'New content' } } },
      { mailingOptions: { ...state.mailingOptions!, finish: 'gloss' as const } },
      { campaignOptions: { isSplitCampaign: false, isRepeating: true } },
      { listData: { useMailingData: true, selectedRecords: ['changed'] } },
      { addressValidation: { orderId: 'job-new', deliverableRecords: 1000 } as OrderState['addressValidation'] },
    ]) {
      const result = applyOrderUpdate(state, updates)
      assert.equal(result.pricing, undefined)
      assert.equal(result.payment, undefined)
      assert.equal(result.approval, undefined)
      assert.equal(result.currentStepValid, false)
      assert.equal(result.proofQuoteRevision, undefined)
    }
  })
  it('synchronizes both state generations so edits cannot leave stale references', () => {
    const state = orderFixture()
    const next = applyOrderUpdate(state, { designAndContent: { design: { ...state.design!, designId: 'new-id' } }, mailingOptions: { serviceLevel: 'print_only', includePostage: false } })
    assert.equal(next.design?.designId, 'new-id')
    assert.equal(next.campaignSettings?.mailingOptions?.serviceLevel, 'print_only')
  })
  it('preserves sibling design/contact/campaign fields during partial consolidated edits', () => {
    const state = orderFixture()
    state.designAndContent = { design: state.design }
    const updated = applyOrderUpdate(state, { designAndContent: { contactCard: { contactCardId: 'new-card' } as NonNullable<OrderState['contactCard']> } })
    assert.equal(updated.design?.designId, 'saved')
    assert.equal(updated.designAndContent?.design?.designId, 'saved')
  })
  it('rejects stale asynchronous writes and preserves fresh quote/payment updates', () => {
    const state = orderFixture()
    const staleKey = orderQuoteKey(state)
    const changed = applyOrderUpdate(state, { mailingOptions: { ...state.mailingOptions!, finish: 'gloss' } })
    assert.equal(applyOrderUpdate(changed, { pricing: finalPricing }, staleKey), changed)
    const current = applyOrderUpdate(state, { pricing: { ...finalPricing } }, staleKey)
    assert.equal(current.payment?.paymentIntentId, 'pi-a')
    assert.equal(current.approval?.designLocked, true)
  })
  it('invalidates an old approval and intent when the server reprices unchanged inputs', () => {
    const result = applyOrderUpdate(orderFixture(), { pricing: { ...finalPricing, quoteRevision: 'new-rate-quote' } })
    assert.equal(result.payment, undefined)
    assert.equal(result.approval, undefined)
  })
  it('blocks provisional or mismatched quotes from approval and payment readiness', () => {
    const state = orderFixture()
    assert.equal(isFinalOrderQuote(finalPricing), true)
    assert.equal(isFinalOrderQuote({ ...finalPricing, quoteStatus: 'provisional' }), false)
    assert.equal(isPaymentForQuote(state.payment, finalPricing), true)
    assert.equal(isPaymentForQuote({ ...state.payment!, quoteRevision: 'stale' }, finalPricing), false)
    assert.equal(approvalMatchesQuote(state.approval, finalPricing), true)
    assert.equal(approvalMatchesQuote({ ...state.approval!, quoteRevision: 'stale' }, finalPricing), false)
  })
})

import { validateOrderStep } from '../../../lib/orders/step-validation'
describe('final quote navigation gates', () => {
  it('requires a fresh final quote and matching artwork approval at review', () => {
    const state = { ...orderFixture(), step: 5 }
    assert.equal(validateOrderStep(state).canProceed, true)
    assert.equal(validateOrderStep({ ...state, pricing: { ...finalPricing, quoteStatus: 'provisional' } }).canProceed, false)
    assert.equal(validateOrderStep({ ...state, proofQuoteRevision: undefined }).canProceed, false)
    assert.equal(validateOrderStep({ ...state, approval: { ...state.approval!, quoteRevision: 'old' } }).canProceed, false)
  })
  it('rejects stale payment even when its status says authorized', () => {
    const state = orderFixture()
    assert.equal(validateOrderStep(state).canProceed, true)
    assert.equal(validateOrderStep({ ...state, payment: { ...state.payment!, quoteRevision: 'old' } }).canProceed, false)
  })
})
