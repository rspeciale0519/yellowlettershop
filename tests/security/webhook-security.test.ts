import { strict as assert } from 'assert'
import { createHmac } from 'crypto'
import { generateWebhookSignature, validateWebhookSecurity } from '../../lib/webhooks/security'

describe('timestamp-bound webhook signatures', () => {
  const payload = JSON.stringify({ type: 'campaign.created', data: { campaign_id: 'sample' } })
  const secret = 'test-only-secret'
  const config = { secret, signatureHeader: 'x-yls-signature', timestampHeader: 'x-yls-timestamp' }
  const sign = (timestamp: string, body = payload) => 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const headers = (timestamp: string, signature = sign(timestamp)) => new Headers({ 'x-yls-signature': signature, 'x-yls-timestamp': timestamp })
  it('signs timestamp.payload and accepts a current signed message', () => {
    const now = Math.floor(Date.now() / 1000).toString()
    assert.equal(generateWebhookSignature(payload, secret, now), sign(now))
    assert.equal(validateWebhookSecurity(payload, headers(now), config).valid, true)
  })
  it('rejects a changed timestamp even when the payload and signature are unchanged', () => {
    const now = Math.floor(Date.now() / 1000)
    assert.equal(validateWebhookSecurity(payload, headers(String(now), sign(String(now - 10))), config).valid, false)
  })
  it('rejects messages older than five minutes even with a valid signature', () => {
    const stale = String(Math.floor(Date.now() / 1000) - 301)
    assert.equal(validateWebhookSecurity(payload, headers(stale), config).valid, false)
    assert.equal(validateWebhookSecurity(payload, headers(stale), { ...config, maxAge: 3600 }).valid, false)
  })
  it('rejects absent, malformed, fractional, negative and future timestamps', () => {
    for (const timestamp of ['', 'NaN', '123abc', '1.5', '-1', '999999999999999999999', String(Math.floor(Date.now() / 1000) + 60)]) {
      assert.equal(validateWebhookSecurity(payload, headers(timestamp), config).valid, false, timestamp)
    }
    assert.equal(validateWebhookSecurity(payload, new Headers({ 'x-yls-signature': sign('1') }), config).valid, false)
  })
  it('rejects body-only legacy signatures and tampered payloads without throwing', () => {
    const now = String(Math.floor(Date.now() / 1000))
    const legacy = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')
    assert.equal(validateWebhookSecurity(payload, headers(now, legacy), config).valid, false)
    assert.equal(validateWebhookSecurity(payload + ' ', headers(now), config).valid, false)
    for (const bad of ['bad', 'sha256=abc', 'é'.repeat(71)]) assert.equal(validateWebhookSecurity(payload, headers(now, bad), config).valid, false)
  })
})
