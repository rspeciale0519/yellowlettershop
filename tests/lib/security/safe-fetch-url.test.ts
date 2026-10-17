import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { isSafeOutboundUrl } from '../../../lib/security/safe-fetch-url'

describe('isSafeOutboundUrl', () => {
  it('allows public https URLs', () => {
    assert.equal(isSafeOutboundUrl('https://files.example.com/img.png'), true)
  })

  it('blocks cloud metadata and loopback (SSRF)', () => {
    assert.equal(isSafeOutboundUrl('http://169.254.169.254/latest/meta-data'), false)
    assert.equal(isSafeOutboundUrl('http://127.0.0.1:54321/'), false)
    assert.equal(isSafeOutboundUrl('http://localhost/admin'), false)
    assert.equal(isSafeOutboundUrl('http://10.0.0.8/secret'), false)
    assert.equal(isSafeOutboundUrl('http://[::1]/'), false)
  })

  it('blocks credentials and non-http schemes', () => {
    assert.equal(isSafeOutboundUrl('https://user:pass@example.com/'), false)
    assert.equal(isSafeOutboundUrl('file:///etc/passwd'), false)
  })
})
