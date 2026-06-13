import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { resolveEmailConfig } from '../../../lib/email/provider'
import {
  orderConfirmationEmail,
  proofReadyEmail,
  paymentCapturedEmail,
  teamInviteEmail,
} from '../../../lib/email/templates'

describe('resolveEmailConfig', () => {
  it('prefers Resend when RESEND_API_KEY is present', () => {
    const cfg = resolveEmailConfig({
      RESEND_API_KEY: 'rk',
      MAILGUN_API_KEY: 'mk',
      MAILGUN_DOMAIN: 'mg.example.com',
      EMAIL_FROM: 'YLS <mail@yls.test>',
    })
    assert.equal(cfg?.provider, 'resend')
    assert.equal(cfg?.from, 'YLS <mail@yls.test>')
  })

  it('falls back to Mailgun when only Mailgun vars are present', () => {
    const cfg = resolveEmailConfig({
      MAILGUN_API_KEY: 'mk',
      MAILGUN_DOMAIN: 'mg.example.com',
    })
    assert.equal(cfg?.provider, 'mailgun')
  })

  it('Mailgun requires BOTH key and domain', () => {
    assert.equal(resolveEmailConfig({ MAILGUN_API_KEY: 'mk' }), null)
  })

  it('returns null when nothing is configured (caller must fail loudly)', () => {
    assert.equal(resolveEmailConfig({}), null)
  })

  it('defaults the from address when EMAIL_FROM is absent', () => {
    const cfg = resolveEmailConfig({ RESEND_API_KEY: 'rk' })
    assert.ok(cfg?.from && cfg.from.includes('@'))
  })
})

describe('email templates', () => {
  it('order confirmation carries order id, total and status link', () => {
    const t = orderConfirmationEmail({
      orderId: 'abc-123',
      shortId: 'ABC',
      total: 123.45,
      recordCount: 250,
      appUrl: 'https://yls.test',
    })
    assert.ok(t.subject.includes('ABC'))
    assert.ok(t.html.includes('$123.45'))
    assert.ok(t.html.includes('https://yls.test/orders/abc-123'))
    assert.ok(t.text.includes('250'))
  })

  it('proof ready links to the order page', () => {
    const t = proofReadyEmail({ orderId: 'o1', shortId: 'O1', appUrl: 'https://yls.test' })
    assert.ok(/proof/i.test(t.subject))
    assert.ok(t.html.includes('https://yls.test/orders/o1'))
  })

  it('payment captured states the captured amount', () => {
    const t = paymentCapturedEmail({
      orderId: 'o1',
      shortId: 'O1',
      total: 50,
      appUrl: 'https://yls.test',
    })
    assert.ok(t.html.includes('$50.00'))
  })

  it('team invite includes team name and accept link', () => {
    const t = teamInviteEmail({
      teamName: 'Acme',
      inviteUrl: 'https://yls.test/accept?x=1',
      role: 'manager',
    })
    assert.ok(t.subject.includes('Acme'))
    assert.ok(t.html.includes('https://yls.test/accept?x=1'))
    assert.ok(t.text.includes('manager'))
  })
})
