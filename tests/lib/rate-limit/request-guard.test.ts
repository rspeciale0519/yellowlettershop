import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { clientIp } from '../../../lib/security/client-ip'
import { rateLimitActor } from '../../../lib/rate-limit/actor'
import { evaluateRateLimit } from '../../../lib/rate-limit/policy'

describe('clientIp', () => {
  it('uses the first X-Forwarded-For hop', () => {
    const req = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
    })
    assert.equal(clientIp(req), '203.0.113.9')
  })

  it('falls back to unknown', () => {
    assert.equal(clientIp(new Request('http://localhost/api')), 'unknown')
  })
})

describe('rateLimitActor', () => {
  const req = new Request('http://localhost/api', {
    headers: { 'x-forwarded-for': '203.0.113.9' },
  })

  it('keys authenticated callers by user id', () => {
    assert.equal(rateLimitActor(req, 'user-1'), 'user:user-1')
  })

  it('falls back to IP for anonymous callers', () => {
    assert.equal(rateLimitActor(req, null), 'ip:203.0.113.9')
    assert.equal(rateLimitActor(req), 'ip:203.0.113.9')
  })
})

describe('checkout rate-limit failure mode', () => {
  it('fails open when the counter store errors', () => {
    const decision = evaluateRateLimit(0, 20, 'open')
    assert.equal(decision.allowed, true)
  })
})
