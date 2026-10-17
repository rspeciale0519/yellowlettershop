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
    assert.deepEqual(supabaseConnectOrigins('http://127.0.0.1:54321'), {
      https: 'http://127.0.0.1:54321',
      wss: 'ws://127.0.0.1:54321',
    })
  })

  it('skips a %3B origin that would inject a CSP directive', () => {
    assert.equal(supabaseConnectOrigins('https://ok.supabase.co%3Bscript-src'), null)
    assert.equal(supabaseConnectOrigins('javascript:alert(1)'), null)
  })

  it('drops unsafe-eval and https wildcards while keeping hydration unsafe-inline', () => {
    const csp = buildContentSecurityPolicy(SUPABASE)
    const directive = (name: string) =>
      csp.split('; ').find((part) => part.startsWith(`${name} `)) ?? ''
    const tokens = (name: string) => directive(name).split(' ').slice(1)

    assert.deepEqual(tokens('script-src'), ["'self'", "'unsafe-inline'", 'https://js.stripe.com'])
    assert.equal(tokens('script-src').includes("'unsafe-eval'"), false)
    assert.equal(tokens('script-src').includes('https:'), false)
    assert.deepEqual(tokens('frame-src'), ['https://js.stripe.com', 'https://hooks.stripe.com'])
    assert.equal(tokens('frame-src').includes('https:'), false)
    assert.deepEqual(tokens('connect-src'), [
      "'self'",
      'https://api.stripe.com',
      'https://example.supabase.co',
      'wss://example.supabase.co',
    ])
    assert.equal(tokens('connect-src').includes('https:'), false)
    assert.deepEqual(tokens('worker-src'), ['blob:'])
    assert.deepEqual(tokens('img-src'), ["'self'", 'data:', 'blob:', 'https:'])
    assert.deepEqual(tokens('font-src'), ["'self'", 'data:'])
    assert.deepEqual(tokens('frame-ancestors'), ["'none'"])
  })
})
