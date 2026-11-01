import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { getSafeInternalPath } from '../../../lib/security/safe-redirect'

describe('getSafeInternalPath', () => {
  it('keeps a same-origin dashboard path', () => {
    assert.equal(getSafeInternalPath('/dashboard/orders'), '/dashboard/orders')
  })

  it('rejects an external URL used as redirectedFrom (open redirect)', () => {
    assert.equal(getSafeInternalPath('https://evil.test/phish'), '/dashboard')
  })

  it('rejects protocol-relative URLs', () => {
    assert.equal(getSafeInternalPath('//evil.test'), '/dashboard')
  })

  it('rejects backslash and scheme-smuggling values', () => {
    assert.equal(getSafeInternalPath('/\\evil.test'), '/dashboard')
    assert.equal(getSafeInternalPath('/https://evil.test'), '/dashboard')
  })

  it('falls back when empty or relative', () => {
    assert.equal(getSafeInternalPath(''), '/dashboard')
    assert.equal(getSafeInternalPath('orders'), '/dashboard')
    assert.equal(getSafeInternalPath(null), '/dashboard')
  })
})
