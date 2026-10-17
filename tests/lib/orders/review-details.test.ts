import { strict as assert } from 'assert'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { orderFixture, finalPricing } from '../../helpers/client-order-fixture'
import { OrderReviewDetails } from '../../../components/orders/quotes/order-review-details'
import { MailingServiceNotices } from '../../../components/orders/steps/mailing/mailing-service-notices'

describe('preserved order review details', () => {
  it('shows sender, authoritative pieces, format, finishing and split/repeat schedule', () => {
    const state = orderFixture()
    state.contactCard = { contactCardId: 'sender', contactCardData: { id: 'sender', firstName: 'Example', lastName: 'Sender', company: 'Example Company', address: { address_line_1: '1 Main St', city: 'Austin', state: 'TX', zip_code: '78701' }, phone: '555-0100', email: 'sender@example.test', isDefault: true, userId: 'owner', createdAt: new Date(), updatedAt: new Date() } }
    state.mailingOptions = { ...state.mailingOptions!, paperStock: 'premium_16pt', finish: 'gloss', includePostage: true, postageType: 'first_class_forever', shippingAddress: state.contactCard.contactCardData.address }
    state.campaignOptions = { isSplitCampaign: true, splitConfig: { numberOfDrops: 2, intervalWeeks: 3 }, isRepeating: true, repeatConfig: { frequency: 'monthly', repetitions: 4 }, scheduledStartDate: new Date('2027-01-02T00:00:00Z') }
    const html = renderToStaticMarkup(createElement(OrderReviewDetails, { state, pricing: finalPricing }))
    for (const text of ['Example Sender', '100 validated pieces', '8.5 × 11 Letter', 'Premium 16pt', 'Gloss', 'First-Class Forever', '1 Main St', '2 drops', '3 weeks', '4 repetitions', 'monthly', 'Jan 2, 2027']) assert.ok(html.includes(text), `Missing ${text}`)
  })
  it('preserves service-specific processing and customer responsibilities', () => {
    const full = renderToStaticMarkup(createElement(MailingServiceNotices, { service: 'full_service' }))
    const ship = renderToStaticMarkup(createElement(MailingServiceNotices, { service: 'ship_processed' }))
    const digital = renderToStaticMarkup(createElement(MailingServiceNotices, { service: 'print_only' }))
    assert.match(full, /CASS-certified addressing/)
    assert.match(full, /3-5 business days/)
    assert.match(ship, /apply postage and mail locally/)
    assert.match(digital, /print-ready PDF files/)
  })
})
