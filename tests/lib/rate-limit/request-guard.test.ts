import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { clientIp } from '../../../lib/security/client-ip'

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
