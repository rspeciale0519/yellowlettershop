import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { evaluateRateLimit, rateLimitKey } from '../../../lib/rate-limit/policy'

describe('rateLimitKey', () => {
  it('namespaces by scope and identifier', () => {
    assert.equal(rateLimitKey('auth', '1.2.3.4'), 'auth:1.2.3.4')
  })
  it('falls back to "unknown" for an empty identifier', () => {
    assert.equal(rateLimitKey('auth', ''), 'auth:unknown')
    assert.equal(rateLimitKey('auth', null), 'auth:unknown')
  })
})

describe('evaluateRateLimit', () => {
  it('allows when the post-increment count is within the limit', () => {
    const r = evaluateRateLimit(1, 100)
    assert.equal(r.allowed, true)
    assert.equal(r.remaining, 99)
  })
  it('allows exactly at the limit', () => {
    const r = evaluateRateLimit(100, 100)
    assert.equal(r.allowed, true)
    assert.equal(r.remaining, 0)
  })
  it('blocks once the count exceeds the limit', () => {
    const r = evaluateRateLimit(101, 100)
    assert.equal(r.allowed, false)
    assert.equal(r.remaining, 0)
  })
  it('fails open (allows) when the store returns a non-positive count', () => {
    // store error path passes 0 → never wrongly block a paying customer
    const r = evaluateRateLimit(0, 100)
    assert.equal(r.allowed, true)
  })
})
