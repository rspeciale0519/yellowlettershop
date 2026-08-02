import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { vendorDispatchEmail, orderShippedEmail } from '../../lib/email/templates'

describe('vendorDispatchEmail', () => {
  const base = {
    shortId: 'AB12CD34',
    vendorName: 'PrintCo',
    recordCount: 250,
    mailClass: 'first_class',
    postageType: 'stamp',
    proofUrl: 'https://x/proof',
    csvUrl: 'https://x/csv',
  }

  it('includes the order facts and both download links', () => {
    const c = vendorDispatchEmail(base)
    assert.ok(c.subject.includes('AB12CD34'))
    assert.ok(c.html.includes('https://x/proof'))
    assert.ok(c.html.includes('https://x/csv'))
    assert.ok(c.html.includes('250'))
    assert.ok(c.text.includes('https://x/proof'))
  })

  it('escapes vendor-controlled fields', () => {
    const c = vendorDispatchEmail({ ...base, vendorName: '<img src=x onerror=alert(1)>' })
    assert.ok(!c.html.includes('<img src=x'))
  })

  it('renders cleanly when mail class and postage are unknown', () => {
    const c = vendorDispatchEmail({ ...base, mailClass: null, postageType: null })
    assert.ok(!c.html.includes('undefined'))
    assert.ok(!c.html.includes('null'))
  })
})

describe('orderShippedEmail', () => {
  it('shows tracking when present', () => {
    const c = orderShippedEmail({
      orderId: 'order-uuid',
      shortId: 'S1',
      trackingNumber: '9400111899',
      trackingCarrier: 'USPS',
      appUrl: 'https://app.example.com',
    })
    assert.ok(c.html.includes('9400111899'))
    assert.ok(c.html.includes('USPS'))
    assert.ok(c.html.includes('https://app.example.com/orders/order-uuid'))
  })

  it('omits tracking cleanly when absent', () => {
    const c = orderShippedEmail({
      orderId: 'order-uuid',
      shortId: 'S1',
      appUrl: 'https://app.example.com',
    })
    assert.ok(!c.html.includes('undefined'))
    assert.ok(!c.html.includes('null'))
    assert.ok(c.subject.includes('S1'))
  })

  it('escapes tracking fields', () => {
    const c = orderShippedEmail({
      orderId: 'order-uuid',
      shortId: 'S1',
      trackingNumber: '<script>alert(1)</script>',
      trackingCarrier: 'USPS',
      appUrl: 'https://app.example.com',
    })
    assert.ok(!c.html.includes('<script>'))
  })
})
