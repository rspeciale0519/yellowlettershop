import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  hmacSha256Hex,
  isWebhookTimestampFresh,
  requireWebhookTimestamp,
  timingSafeEqualHex,
  verifyHmacSha256Hex,
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
})
