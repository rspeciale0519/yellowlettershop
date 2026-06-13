import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { resolveEmailConfig } from '../../../lib/email/provider'
import {
  orderConfirmationEmail,
  proofReadyEmail,
  paymentCapturedEmail,
  teamInviteEmail,
  esc,
  safeUrl,
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

  it('escapes a malicious team name instead of rendering it as HTML', () => {
    const t = teamInviteEmail({
      teamName: 'Acme</strong><a href="http://evil.test">click</a><strong>',
      inviteUrl: 'https://yls.test/accept?x=1',
      role: 'manager',
    })
    // The injected anchor must NOT appear as live markup in the body.
    assert.ok(!t.html.includes('<a href="http://evil.test">'))
    assert.ok(t.html.includes('&lt;a href=&quot;http://evil.test&quot;&gt;'))
  })

  it('neutralizes a javascript: invite URL down to #', () => {
    const t = teamInviteEmail({
      teamName: 'Acme',
      inviteUrl: 'javascript:alert(document.cookie)',
      role: 'manager',
    })
    assert.ok(!t.html.includes('javascript:'))
    assert.ok(t.html.includes('href="#"'))
  })
})

describe('esc', () => {
  it('escapes all five HTML-significant characters', () => {
    assert.equal(esc(`<a href="x" data-y='z'>&`), '&lt;a href=&quot;x&quot; data-y=&#39;z&#39;&gt;&amp;')
  })
  it('leaves benign text untouched', () => {
    assert.equal(esc('Acme Realty 123'), 'Acme Realty 123')
  })
})

describe('safeUrl', () => {
  it('passes http and https through unchanged', () => {
    assert.equal(safeUrl('https://yls.test/a?b=1'), 'https://yls.test/a?b=1')
    assert.equal(safeUrl('http://yls.test'), 'http://yls.test')
  })
  it('collapses dangerous or malformed schemes to #', () => {
    assert.equal(safeUrl('javascript:alert(1)'), '#')
    assert.equal(safeUrl('data:text/html,<script>1</script>'), '#')
    assert.equal(safeUrl('not a url'), '#')
  })
})
