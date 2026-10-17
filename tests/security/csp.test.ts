import { strict as assert } from 'assert'

describe('CSP Supabase origin validation', () => {
  const builder = () => require('../../lib/security/csp') as { buildCsp: (url?: string, development?: boolean) => string }
  it('uses only a valid HTTPS Supabase origin and matching websocket origin', () => {
    const csp = builder().buildCsp('https://example.supabase.co/')
    assert.ok(csp.includes('https://example.supabase.co'))
    assert.ok(csp.includes('wss://example.supabase.co'))
    assert.ok(csp.includes("object-src 'none'"))
    assert.ok(csp.includes("frame-ancestors 'none'"))
  })
  it('rejects malformed URLs and CSP directive injection', () => {
    for (const url of ['not a url', 'javascript:alert(1)', 'https://host;script-src *', 'https://host%3bevil', 'https://host%27evil', 'https://*', 'https://host..evil', 'https://host\n.evil', 'https://user:pass@host', 'https://host/path', 'https://host?x=1', 'https://host#x', '//host', 'ftp://host', 'http://remote.example']) {
      assert.throws(() => builder().buildCsp(url), /Supabase URL/, url)
    }
  })
  it('allows explicit local development HTTP and never adds undefined or wildcard sources', () => {
    assert.ok(builder().buildCsp('http://127.0.0.1:62440', true).includes('ws://127.0.0.1:62440'))
    assert.throws(() => builder().buildCsp('http://127.0.0.1:62440'), /Supabase URL/)
    assert.equal(builder().buildCsp().includes('undefined'), false)
    assert.equal(builder().buildCsp().includes(' *'), false)
  })
})
