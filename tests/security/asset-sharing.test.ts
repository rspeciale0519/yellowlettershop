import { strict as assert } from 'assert'
import { loadWithMocks } from '../helpers/module-mocks'

describe('owned asset sharing before privileged storage access', () => {
  let row: Record<string, any>
  let signed: string[]
  const client = {
    from: () => { const q = { select: () => q, eq: () => q, single: async () => ({ data: row, error: null }) }; return q },
    storage: { from: () => ({ createSignedUrl: async (path: string) => { signed.push(path); return { data: { signedUrl: 'https://example.test/file' }, error: null } } }) },
  }
  const { ShareService } = loadWithMocks<{ ShareService: new () => { validateShareToken: (token: string) => Promise<unknown>; streamFile: (path: string, owner: string) => Promise<unknown> } }>('../../lib/assets/share-service', {
    '../../utils/supabase/service': { createServiceClient: () => client },
  })
  const service = new ShareService()
  beforeEach(() => { signed = []; row = { id: 'share-a', created_by: 'owner', created_at: new Date(Date.now() - 1000).toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString(), asset: { user_id: 'owner', file_path: 'owner/file.pdf' } } })
  it('rejects forged owned metadata pointing to a foreign storage path', async () => {
    row.asset.file_path = 'other/private.pdf'
    assert.equal(await service.validateShareToken('sample-token'), null)
    assert.deepEqual(signed, [])
  })
  it('rejects a share creator who does not own the referenced asset', async () => {
    row.created_by = 'other'
    assert.equal(await service.validateShareToken('sample-token'), null)
  })
  it('rejects missing, malformed, expired and over-30-day expiry before streaming', async () => {
    for (const expiry of [null, 'invalid', new Date(Date.now()-1).toISOString(), new Date(Date.now()+31*86400000).toISOString()]) {
      row.expires_at = expiry
      assert.equal(await service.validateShareToken('sample-token'), null)
    }
    assert.deepEqual(signed, [])
  })
  it('bounds total lifetime from creation and rejects missing or future creation dates', async () => {
    for (const created of [null, 'invalid', new Date(Date.now()+86400000).toISOString(), new Date(Date.now()-365*86400000).toISOString()]) {
      row.created_at = created
      assert.equal(await service.validateShareToken('sample-token'), null)
    }
    assert.deepEqual(signed, [])
  })
  it('rejects traversal before signing even if streaming is called directly', async () => {
    const previous = globalThis.fetch
    globalThis.fetch = async () => new Response('sample')
    try {
      for (const path of ['other/private.pdf','owner/../other/private.pdf','owner/%2e%2e/private.pdf','owner//file.pdf']) {
        assert.equal(await service.streamFile(path, 'owner'), null)
      }
      assert.deepEqual(signed, [])
    } finally { globalThis.fetch = previous }
  })
  it('preserves valid owned shares and file streaming', async () => {
    assert.ok(await service.validateShareToken('sample-token'))
    const previous = globalThis.fetch
    globalThis.fetch = async () => new Response('sample', { headers: { 'Content-Length': '6' } })
    try { assert.ok(await service.streamFile('owner/file.pdf', 'owner')); assert.deepEqual(signed, ['owner/file.pdf']) }
    finally { globalThis.fetch = previous }
  })
})
