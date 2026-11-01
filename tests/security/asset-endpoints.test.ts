import { strict as assert } from 'assert'
import { loadWithMocks } from '../helpers/module-mocks'

describe('all asset HTTP storage entry points reject forged owned metadata', () => {
  let asset: Record<string, unknown>
  let signed: string[], moved: string[], removed: string[]
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from: () => {
      const q = { select: () => q, eq: () => q, in: () => q, or: () => q, order: () => q, limit: () => q,
        update: () => q, delete: () => q,
        single: async () => ({ data: asset, error: null }),
        then: (resolve: (data: unknown) => unknown) => Promise.resolve(resolve({ data: [asset], error: null })),
      }; return q
    },
    storage: { from: () => ({
      createSignedUrl: async (path: string) => { signed.push(path); return { data: { signedUrl: 'https://example.test/file' }, error: null } },
      move: async (path: string) => { moved.push(path); return { error: null } },
      remove: async (paths: string[]) => { removed.push(...paths); return { error: null } },
    }) },
  }
  const mocks = { '../../utils/supabase/server': { createServerClient: async () => client }, '../../utils/supabase/service': { createServiceClient: () => client } }
  const single = loadWithMocks<{ GET: (req: Request, ctx: unknown) => Promise<Response> }>('../../app/api/assets/[assetId]/signed-url/route', mocks)
  const bulk = loadWithMocks<{ POST: (req: Request) => Promise<Response> }>('../../app/api/assets/bulk-download/route', mocks)
  const stats = loadWithMocks<{ GET: (req: Request) => Promise<Response> }>('../../app/api/assets/stats/route', mocks)
  const assets = loadWithMocks<Record<string, (req: Request) => Promise<Response>>>('../../app/api/assets/route', mocks)
  const request = (method: string, body?: unknown) => new Request('http://localhost/api/assets?assetId=test', { method, ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) })
  beforeEach(() => { signed = []; moved = []; removed = []; asset = { id: 'test', user_id: 'owner', file_type: 'image', file_path: 'other/private.png', filename: 'old.png', metadata: {} } })
  afterEach(() => { assert.deepEqual(signed, []); assert.deepEqual(moved, []); assert.deepEqual(removed, []) })
  it('rejects the alternate signed-url endpoint before signing', async () => {
    assert.equal((await single.GET(request('GET'), { params: Promise.resolve({ assetId: 'test' }) })).status, 404)
  })
  it('excludes unsafe list metadata instead of signing or returning its fallback URL', async () => {
    const response = await assets.GET(request('GET'))
    assert.equal(response.status, 200); assert.deepEqual(await response.json(), [])
  })
  it('excludes unsafe recent uploads from asset statistics', async () => {
    const response = await stats.GET(request('GET'))
    assert.equal(response.status, 200)
    assert.deepEqual((await response.json()).recentUploads, [])
  })
  it('refuses foreign-path bulk downloads before signing or fetching', async () => {
    assert.equal((await bulk.POST(request('POST', { fileIds: ['test'] }))).status, 404)
  })
  it('refuses foreign-path privileged renames', async () => {
    assert.equal((await assets.PATCH(request('PATCH', { assetId: 'test', updates: { name: 'new.png' } }))).status, 404)
  })
  it('refuses foreign-path privileged deletion', async () => {
    assert.equal((await assets.DELETE(request('DELETE', { assetId: 'test' }))).status, 404)
  })
})
