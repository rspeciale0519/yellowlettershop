import { strict as assert } from 'assert'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OrderQuoteSummary } from '../../../components/orders/quotes/order-quote-summary'
import { finalPricing } from '../../helpers/client-order-fixture'

describe('wizard quote summary', () => {
  it('shows validated quantity, separate additional-side charge and final total', () => {
    const html = renderToStaticMarkup(createElement(OrderQuoteSummary, { pricing: { ...finalPricing, addOnServices: [{ id: 'additional_printed_sides', name: 'Additional printed sides', unitPrice: 0.1, quantity: 100, totalPrice: 10, description: 'Per extra side per piece' }] }, isLoading: false }))
    assert.match(html, /100 validated pieces/)
    assert.match(html, /Additional printed sides/)
    assert.match(html, /\$10\.00/)
    assert.match(html, /\$85\.00/)
    assert.match(html, /Final quote/)
  })
  it('labels provisional pricing as an estimate requiring save and validation', () => {
    const html = renderToStaticMarkup(createElement(OrderQuoteSummary, { pricing: { ...finalPricing, quoteStatus: 'provisional' }, isLoading: false }))
    assert.match(html, /Provisional estimate/)
    assert.match(html, /Save your design and complete address validation/)
  })
})
