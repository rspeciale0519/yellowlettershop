import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { isBlockedIp, normalizeIp } from '../../../lib/security/blocked-ip'
import { isSafeOutboundUrl } from '../../../lib/security/safe-fetch-url'
import { pinnedLookup, safeFetch } from '../../../lib/security/safe-fetch'

describe('blocked IP ranges', () => {
  const blocked = [
    ['0.0.0.0/8', '0.1.2.3'],
    ['10/8', '10.9.8.7'],
    ['127/8', '127.0.0.1'],
    ['169.254/16', '169.254.169.254'],
    ['172.16/12', '172.31.255.1'],
    ['192.168/16', '192.168.1.20'],
    ['100.64/10', '100.64.0.1'],
    ['100.64/10 high', '100.127.255.255'],
    ['::', '::'],
    ['::1', '::1'],
    ['fc00::/7', 'fc00::1'],
    ['fd00 unique local', 'fd12:3456::1'],
    ['fe80::/10', 'fe80::1'],
    ['IPv4-mapped loopback', '::ffff:127.0.0.1'],
    ['IPv4-mapped CGNAT', '::ffff:100.64.0.8'],
    ['IPv4-mapped hex loopback', '::ffff:7f00:1'],
  ] as const

  for (const [label, ip] of blocked) {
    it(`blocks ${label} (${ip})`, () => {
      assert.equal(isBlockedIp(ip), true, label)
    })
  }

  it('allows public IPv4 and IPv6', () => {
    assert.equal(isBlockedIp('8.8.8.8'), false)
    assert.equal(isBlockedIp('203.0.113.9'), false)
    assert.equal(isBlockedIp('100.63.255.255'), false)
    assert.equal(isBlockedIp('100.128.0.1'), false)
    assert.equal(isBlockedIp('2001:4860:4860::8888'), false)
  })

  it('normalizes IPv4-mapped IPv6 before checking', () => {
    assert.deepEqual(normalizeIp('::ffff:127.0.0.1'), { address: '127.0.0.1', type: 'ipv4' })
    assert.deepEqual(normalizeIp('[::ffff:7f00:1]'), { address: '127.0.0.1', type: 'ipv4' })
  })
})

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
    assert.equal(isSafeOutboundUrl('http://[::ffff:127.0.0.1]/'), false)
    assert.equal(isSafeOutboundUrl('http://100.64.0.1/'), false)
  })

  it('blocks credentials and non-http schemes', () => {
    assert.equal(isSafeOutboundUrl('https://user:pass@example.com/'), false)
    assert.equal(isSafeOutboundUrl('file:///etc/passwd'), false)
  })
})

describe('safeFetch', () => {
  it('rejects a hostname that resolves to an internal IP', async () => {
    await assert.rejects(
      () =>
        safeFetch('https://evil.example/img', {
          resolve: async () => [{ address: '10.0.0.8', family: 4 }],
          fetchImpl: async () => new Response('nope'),
        }),
      /blocked address/
    )
  })

  it('rejects a 3xx redirect instead of following it to an internal host', async () => {
    await assert.rejects(
      () =>
        safeFetch('https://files.example.com/img.png', {
          resolve: async () => [{ address: '203.0.113.9', family: 4 }],
          fetchImpl: async () =>
            new Response(null, {
              status: 302,
              headers: { Location: 'http://127.0.0.1/secret' },
            }),
        }),
      /redirect is not allowed/
    )
  })

  it('pins the first DNS result so a rebinding second resolve cannot sneak in', async () => {
    let resolves = 0
    const resolve = async () => {
      resolves += 1
      return resolves === 1
        ? [{ address: '203.0.113.9' as const, family: 4 as const }]
        : [{ address: '127.0.0.1' as const, family: 4 as const }]
    }
    const res = await safeFetch('https://files.example.com/img.png', {
      resolve,
      fetchImpl: async () => new Response('ok', { status: 200 }),
    })
    assert.equal(res.status, 200)
    assert.equal(resolves, 1)

    const lookup = pinnedLookup([{ address: '203.0.113.9', family: 4 }])
    await new Promise<void>((done) => {
      lookup('files.example.com', { family: 4 }, (err, address) => {
        assert.equal(err, null)
        assert.equal(address, '203.0.113.9')
        done()
      })
    })
  })

  it('keeps a public https image fetch working', async () => {
    const res = await safeFetch('https://cdn.example.com/a.png', {
      resolve: async () => [{ address: '203.0.113.50', family: 4 }],
      fetchImpl: async () => new Response('png', { status: 200 }),
    })
    assert.equal(res.status, 200)
    assert.equal(await res.text(), 'png')
  })
})
