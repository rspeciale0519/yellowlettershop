import { strict as assert } from 'assert'
import type { NextRequest } from 'next/server'
import { loadWithMocks } from '../helpers/module-mocks'
import { generateWebhookSignature, validateWebhookSecurity } from '../../lib/webhooks/security'

describe('custom webhook sender/receiver integration', () => {
  const secret = 'local-webhook-regression-secret'
  let originalSecret: string | undefined
  let writes: Array<Record<string, unknown>>
  let clients: number
  const client = { from: () => ({ insert: async (value: Record<string, unknown>) => { writes.push(value); return { error: null } } }) }
  const route = loadWithMocks<{ POST: (req: NextRequest) => Promise<Response> }>('../../app/api/webhooks/route', {
    '../../utils/supabase/service': { createServiceClient: () => { clients++; return client } },
  })
  const request = (timestamp: string, signature?: string, eventType = 'campaign.created') => {
    const payload = JSON.stringify({ id: 'test-delivery', type: 'campaign.created', data: { webhook_id: 'webhook-test', campaign_id: 'campaign-test' } })
    return new Request('http://localhost/api/webhooks', { method: 'POST', headers: { 'x-yls-event-type': eventType, 'x-yls-timestamp': timestamp, 'x-yls-signature': signature ?? generateWebhookSignature(payload, secret, timestamp) }, body: payload }) as NextRequest
  }
  beforeEach(() => { originalSecret = process.env.WEBHOOK_SECRET; process.env.WEBHOOK_SECRET = secret; writes = []; clients = 0 })
  afterEach(() => { if (originalSecret === undefined) delete process.env.WEBHOOK_SECRET; else process.env.WEBHOOK_SECRET = originalSecret })
  it('rejects stale signed events before creating a database client', async () => {
    assert.equal((await route.POST(request(String(Math.floor(Date.now() / 1000) - 301)))).status, 401)
    assert.equal(clients, 0); assert.deepEqual(writes, [])
  })
  it('rejects malformed signatures and event-header substitution before writes', async () => {
    const now = String(Math.floor(Date.now() / 1000))
    assert.equal((await route.POST(request(now, 'sha256=nope'))).status, 401)
    assert.equal((await route.POST(request(now, undefined, 'order.payment_captured'))).status, 400)
    assert.equal(clients, 0); assert.deepEqual(writes, [])
  })
  it('uses the service client only after verifying the signed envelope', async () => {
    assert.equal((await route.POST(request(String(Math.floor(Date.now() / 1000))))).status, 200)
    assert.equal(clients, 1)
    assert.equal(writes[0].webhook_id, 'webhook-test')
    assert.equal((writes[0].payload as Record<string, unknown>).campaign_id, 'campaign-test')
  })
  it('sends a timestamp and signature accepted by the receiver verifier', async () => {
    const outgoing = loadWithMocks<{ triggerWebhookEvent: (event: string, data: Record<string, unknown>) => Promise<void> }>('../../lib/supabase/webhooks', {
      '../../utils/supabase/client': { createClient: () => ({ from: (table: string) => {
        const query = { select: () => query, eq: () => query, contains: async () => ({ data: [{ id: 'webhook-test', secret, url: 'https://example.test/webhook' }], error: null }), insert: () => query, single: async () => ({ data: {}, error: null }) }
        return query
      } }) },
    })
    const previousFetch = globalThis.fetch
    let captured: RequestInit | undefined
    globalThis.fetch = async (_url, init) => { captured = init; return new Response('{}', { status: 200 }) }
    try { await outgoing.triggerWebhookEvent('campaign.created', { campaign_id: 'sample' }) }
    finally { globalThis.fetch = previousFetch }
    assert.ok(captured)
    const headers = new Headers(captured.headers)
    assert.ok(headers.get('x-yls-timestamp'))
    assert.equal(validateWebhookSecurity(String(captured.body), headers, { secret, signatureHeader: 'x-yls-signature' }).valid, true)
  })
})
