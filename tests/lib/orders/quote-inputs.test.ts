import { strict as assert } from 'assert'
import { getProductPrintPolicy } from '../../../lib/orders/additional-side-pricing'
import { resolveOrderQuoteInputs } from '../../../lib/orders/quote-inputs'

import { artwork } from '../../helpers/quote-fixtures'
const policy = getProductPrintPolicy('letter_8_5x11')
const state = { mailingOptions: { serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11' }, validatedQuantity: 250 }
describe('resolveOrderQuoteInputs', () => {
  it('excludes unused legacy back and includes explicitly added blank back', () => {
    assert.equal(resolveOrderQuoteInputs(state, artwork(), policy).additionalSideChargeCents, 0)
    assert.equal(resolveOrderQuoteInputs(state, artwork(true), policy).additionalSideChargeCents, 2500)
  })
  it('ignores caller side rate count and total fields', () => {
    const result = resolveOrderQuoteInputs({ ...state, sideCount: 100, additionalPrintedSideCents: 0, pricing: { totalPrice: 0.01 } }, artwork(true), policy)
    assert.equal(result.printedSideCount, 2)
    assert.equal(result.quantity, 250)
    assert.equal(result.additionalSideChargeCents, 2500)
  })
  it('updates removal and validated quantity', () => {
    assert.equal(resolveOrderQuoteInputs({ ...state, validatedQuantity: 1000 }, artwork(true), policy).additionalSideChargeCents, 10000)
    assert.equal(resolveOrderQuoteInputs(state, artwork(), policy).printedSideCount, 1)
  })
  it('rejects fractional quantities and format mismatch', () => {
    assert.throws(() => resolveOrderQuoteInputs({ ...state, validatedQuantity: 1.2 }, artwork(), policy))
    assert.throws(() => resolveOrderQuoteInputs({ ...state, mailingOptions: { ...state.mailingOptions, mailPieceFormat: 'postcard_4x6' } }, artwork(), policy))
  })
  it('keeps two postcard sides and rejects additional postcard capacity', () => {
    const doc = artwork(true)
    doc.formatId = 'postcard_4x6'
    const postcard = { ...state, mailingOptions: { ...state.mailingOptions, mailPieceFormat: 'postcard_4x6' } }
    assert.equal(resolveOrderQuoteInputs(postcard, doc, getProductPrintPolicy('postcard_4x6')).additionalSideChargeCents, 0)
    doc.pages['page-extra'] = []
    doc.pageOrder.push('page-extra')
    doc.pageSettings['page-extra'] = { ...doc.pageSettings.front, printIncluded: true }
    assert.throws(() => resolveOrderQuoteInputs(postcard, doc, getProductPrintPolicy('postcard_4x6')))
  })
})
