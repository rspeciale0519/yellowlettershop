import { strict as assert } from 'assert'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PricingConfig } from '../../../lib/admin/types'
import { PricingTable } from '../../../components/admin/pricing/pricing-table'

describe('admin printing rate display', () => {
  it('shows configured mail-piece amounts in the same cents units as checkout', () => {
    const item = { id: 'rate', category: 'mail_piece', key: 'postcard_6x9', displayName: '6 x 9 Postcard', pricingModel: 'per_unit', unitAmount: 89, unitLabel: 'per piece', isActive: true, isPublic: true } as PricingConfig
    const html = renderToStaticMarkup(createElement(PricingTable, { items: [item], onEdit: () => undefined, onToggleActive: () => undefined, onViewHistory: () => undefined }))
    assert.match(html, /\$0\.89/)
    assert.doesNotMatch(html, /\$0\.089/)
  })
})
