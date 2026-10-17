import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  hmacSha256Hex,
  isWebhookTimestampFresh,
  requireWebhookTimestamp,
  signYlsWebhook,
  timingSafeEqualHex,
  verifyHmacSha256Hex,
  verifyYlsWebhook,
} from '../../../lib/security/webhook-crypto'

describe('webhook crypto', () => {
  it('accepts a matching hex HMAC and rejects a truncated one without throwing', () => {
    const digest = hmacSha256Hex('secret', 'body')
    assert.equal(verifyHmacSha256Hex('secret', 'body', `sha256=${digest}`), true)
    assert.equal(timingSafeEqualHex(digest, digest.slice(0, 8)), false)
    assert.equal(verifyHmacSha256Hex('secret', 'body', 'nope'), false)
  })

  it('rejects a replayed Mailgun timestamp older than 5 minutes', () => {
    const now = 1_700_000_000
    assert.equal(isWebhookTimestampFresh(String(now - 301), 300, now), false)
    assert.equal(isWebhookTimestampFresh(String(now - 30), 300, now), true)
    assert.equal(isWebhookTimestampFresh('not-a-number', 300, now), false)
  })

  it('requires x-yls-timestamp and rejects missing or stale values', () => {
    const now = 1_700_000_000
    const missing = requireWebhookTimestamp(null, 300, now)
    assert.equal(missing.ok, false)
    if (!missing.ok) {
      assert.equal(missing.status, 401)
      assert.match(missing.error, /missing or too old/)
    }

    const stale = requireWebhookTimestamp(String(now - 301), 300, now)
    assert.equal(stale.ok, false)
    if (!stale.ok) assert.equal(stale.status, 401)

    const fresh = requireWebhookTimestamp(String(now - 30), 300, now)
    assert.equal(fresh.ok, true)
  })

  it('accepts a timestamp-bound HMAC and rejects replay, stale, and missing timestamps', () => {
    const now = 1_700_000_000
    const body = '{"type":"campaign.created"}'
    const capturedTs = String(now - 40)
    const capturedSig = signYlsWebhook('secret', capturedTs, body)

    const valid = verifyYlsWebhook({
      timestamp: capturedTs,
      body,
      signature: capturedSig,
      secret: 'secret',
      nowSeconds: now,
    })
    assert.equal(valid.ok, true)

    const swappedFresh = verifyYlsWebhook({
      timestamp: String(now - 5),
      body,
      signature: capturedSig,
      secret: 'secret',
      nowSeconds: now,
    })
    assert.equal(swappedFresh.ok, false)
    if (!swappedFresh.ok) assert.equal(swappedFresh.status, 401)

    const staleTs = String(now - 301)
    const stale = verifyYlsWebhook({
      timestamp: staleTs,
      body,
      signature: signYlsWebhook('secret', staleTs, body),
      secret: 'secret',
      nowSeconds: now,
    })
    assert.equal(stale.ok, false)
    if (!stale.ok) assert.match(stale.error, /missing or too old/)

    const missing = verifyYlsWebhook({
      timestamp: null,
      body,
      signature: capturedSig,
      secret: 'secret',
      nowSeconds: now,
    })
    assert.equal(missing.ok, false)
    if (!missing.ok) assert.match(missing.error, /missing or too old/)
  })
})
