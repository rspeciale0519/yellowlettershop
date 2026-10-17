import { strict as assert } from 'assert'
import { loadWithMocks } from '../helpers/module-mocks'

describe('private preview URL and authenticated renderer contract', () => {
  let renderedOwner: string | undefined
  let signedPath: string | undefined
  const client = { storage: { from: () => ({
    upload: async () => ({ error: null }),
    getPublicUrl: () => { throw new Error('Private previews must never use a public URL') },
    createSignedUrl: async (path: string) => { signedPath = path; return { data: { signedUrl: 'https://example.test/private-preview' }, error: null } },
  }) } }
  const route = loadWithMocks<{ POST: (req: Request, auth: { userId: string }) => Promise<Response> }>('../../app/api/design/preview/route', {
    '../../lib/auth/middleware': { withAuth: (handler: unknown) => handler },
    '../../utils/supabase/service': { createClient: () => client },
    '../../app/api/design/preview/_render/pdf-renderer': { renderDesignToPdf: async (_doc: unknown, _ctx: unknown, _format: unknown, _orientation: unknown, options: { ownerUserId?: string }) => { renderedOwner = options.ownerUserId; return new Uint8Array([37,80,68,70]) } },
  })
  it('uses the session owner and a signed private URL, ignoring a forged body owner', async () => {
    const response = await route.POST(new Request('http://localhost/api/design/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ designState: { pages: { front: [], back: [] } }, ownerUserId: 'other' }) }), { userId: 'owner' })
    assert.equal(response.status, 200)
    assert.equal(renderedOwner, 'owner')
    assert.match(signedPath!, /^owner\/[^/]+\.pdf$/)
    assert.equal((await response.json()).pdfUrl, 'https://example.test/private-preview')
  })
})
