import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  buildContentSecurityPolicy,
  supabaseConnectOrigins,
} from '../../../lib/security/content-security-policy'

const SUPABASE = 'https://example.supabase.co'

describe('content-security-policy', () => {
  it('derives https and wss origins from the Supabase URL', () => {
    assert.deepEqual(supabaseConnectOrigins(SUPABASE), {
      https: 'https://example.supabase.co',
      wss: 'wss://example.supabase.co',
    })
    assert.deepEqual(supabaseConnectOrigins('http://127.0.0.1:54321', true), {
      https: 'http://127.0.0.1:54321',
      wss: 'ws://127.0.0.1:54321',
    })
  })

  it('rejects invalid or injected origins instead of accepting partial configuration', () => {
    assert.throws(() => supabaseConnectOrigins('https://ok.supabase.co%3Bscript-src'), /Supabase URL/)
    assert.throws(() => supabaseConnectOrigins('javascript:alert(1)'), /Supabase URL/)
  })

  it('drops unsafe-eval and https wildcards while keeping hydration unsafe-inline', () => {
    const csp = buildContentSecurityPolicy(SUPABASE)
    const directive = (name: string) =>
      csp.split('; ').find((part) => part.startsWith(`${name} `)) ?? ''
    const tokens = (name: string) => directive(name).split(' ').slice(1)

    assert.deepEqual(tokens('script-src'), ["'self'", "'unsafe-inline'", 'https://js.stripe.com'])
    assert.equal(tokens('script-src').includes("'unsafe-eval'"), false)
    assert.equal(tokens('script-src').includes('https:'), false)
    assert.deepEqual(tokens('frame-src'), ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com', SUPABASE])
    assert.equal(tokens('frame-src').includes('https:'), false)
    assert.deepEqual(tokens('connect-src'), [
      "'self'",
      'https://api.stripe.com',
      'https://example.supabase.co',
      'wss://example.supabase.co',
    ])
    assert.equal(tokens('connect-src').includes('https:'), false)
    assert.deepEqual(tokens('worker-src'), ["'self'", 'blob:'])
    assert.deepEqual(tokens('img-src'), ["'self'", 'data:', 'blob:', 'https:'])
    assert.deepEqual(tokens('font-src'), ["'self'", 'data:', 'https://fonts.gstatic.com'])
    assert.deepEqual(tokens('frame-ancestors'), ["'none'"])
  })
})
