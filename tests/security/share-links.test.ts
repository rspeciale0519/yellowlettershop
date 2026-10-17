import { strict as assert } from 'assert'
import { createHash } from 'crypto'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { loadWithMocks } from '../helpers/module-mocks'
import { hashShareToken, parseShareExpiryDays, SHARE_LINK_MAX_DAYS } from '../../lib/assets/share-token'

describe('share token hashing and expiry', () => {
  it('hashes the raw token and requires a 1-30 day expiry', () => {
    const raw = 'a'.repeat(64)
    const hashed = hashShareToken(raw)
    assert.equal(hashed, createHash('sha256').update(raw, 'utf8').digest('hex'))
    assert.notEqual(hashed, raw)
    assert.equal(SHARE_LINK_MAX_DAYS, 30)
    assert.equal(parseShareExpiryDays(30).ok, true)
    assert.equal(parseShareExpiryDays(0).ok, false)
    assert.equal(parseShareExpiryDays(31).ok, false)
    assert.equal(parseShareExpiryDays(undefined).ok, false)
  })
})

describe('share-links HTTP create/resolve/expire/revoke', () => {
  const stored: Array<Record<string, unknown>> = []
  let generated = 'raw-share-token-value'
  const service = {
    rpc: async (name: string) => ({ data: name === 'generate_share_token' ? generated : null }),
    from: () => {
      const query: Record<string, unknown> = {}
      const self = {
        select: () => self,
        insert: (row: Record<string, unknown>) => { stored.push(row); return self },
        update: (row: Record<string, unknown>) => { Object.assign(stored[0] || {}, row); return self },
        eq: () => self,
        single: async () => ({ data: stored[stored.length - 1] ?? { id: 'share', expires_at: new Date(Date.now() + 86400000).toISOString(), user_id: 'owner' }, error: null }),
      }
      return Object.assign(query, self)
    },
  }
  const userClient = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from: () => service.from(),
  }
  const route = loadWithMocks<{ POST: (req: Request) => Promise<Response>; DELETE: (req: Request) => Promise<Response> }>(
    '../../app/api/share-links/route',
    {
      '../../utils/supabase/server': { createServerClient: async () => userClient },
      '../../utils/supabase/service': { createServiceClient: () => service },
    }
  )
  const shareGet = loadWithMocks<{ GET: (req: Request, ctx: unknown) => Promise<Response> }>('../../app/api/share/[token]/route', {
    '../../lib/assets/share-service': {
      shareService: {
        validateShareToken: async (token: string) => {
          const row = stored.find((item) => item.share_token === hashShareToken(token) && item.is_active !== false)
          if (!row) return null
          if (row.expires_at && new Date(String(row.expires_at)) < new Date()) return null
          return { id: 'share', access_count: 0, asset: { user_id: 'owner', file_path: 'owner/file.png', filename: 'file.png', mime_type: 'image/png' } }
        },
        streamFile: async () => ({ fileBuffer: new Uint8Array([1, 2, 3]), fileSize: 3, mimeType: 'image/png' }),
        incrementAccessCount: async () => undefined,
      },
    },
  })

  beforeEach(() => { stored.length = 0; generated = 'raw-share-token-value' })

  it('creates a hashed token, resolves it, and refuses expired or revoked links', async () => {
    const created = await route.POST(new Request('http://localhost/api/share-links', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ assetId: 'asset-1', expiresInDays: 7 }),
    }))
    assert.equal(created.status, 200)
    const body = await created.json() as { shareToken: string }
    assert.equal(body.shareToken, generated)
    assert.equal(stored[0].share_token, hashShareToken(generated))
    assert.notEqual(stored[0].share_token, generated)

    const resolved = await shareGet.GET(new Request('http://localhost/api/share/' + generated), { params: Promise.resolve({ token: generated }) })
    assert.equal(resolved.status, 200)
    assert.equal(resolved.headers.get('cache-control'), 'private, no-store')
    assert.equal(resolved.headers.get('x-frame-options'), 'DENY')

    stored[0].expires_at = new Date(Date.now() - 1000).toISOString()
    assert.equal((await shareGet.GET(new Request('http://localhost/api/share/' + generated), { params: Promise.resolve({ token: generated }) })).status, 404)

    stored[0].expires_at = new Date(Date.now() + 86400000).toISOString()
    const revoked = await route.DELETE(new Request('http://localhost/api/share-links', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: generated }),
    }))
    assert.equal(revoked.status, 200)
    stored[0].is_active = false
    assert.equal((await shareGet.GET(new Request('http://localhost/api/share/' + generated), { params: Promise.resolve({ token: generated }) })).status, 404)
  })
})

describe('generate_share_token stores only a hash', function () {
  this.timeout(30000)
  it('returns a random token that is not what gets persisted', async () => {
    const db = new PGlite()
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    `)
    await db.exec(readFileSync(resolve(__dirname, '../../supabase/migrations/20261017120200_share_tokens_identity_pricing.sql'), 'utf8'))
    const token = (await db.query<{ generate_share_token: string }>('select generate_share_token()')).rows[0].generate_share_token
    assert.equal(token.length, 64)
    assert.notEqual(hashShareToken(token), token)
    await db.close()
  })
})
