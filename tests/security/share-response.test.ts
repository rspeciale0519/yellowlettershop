import { strict as assert } from 'assert'
import { loadWithMocks } from '../helpers/module-mocks'

describe('share responses treat owner-editable MIME and filenames as untrusted', () => {
  let mime: string, filename: string
  const payload = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
  const route = loadWithMocks<{ GET: (req: Request, ctx: unknown) => Promise<Response> }>('../../app/api/share/[token]/route', {
    '../../lib/assets/share-service': { shareService: {
      validateShareToken: async () => ({ id: 'share', access_count: 0, asset: { user_id: 'owner', file_path: 'owner/file.svg', filename, mime_type: mime } }),
      streamFile: async () => ({ fileBuffer: payload, fileSize: payload.byteLength, mimeType: mime }),
      incrementAccessCount: async () => undefined,
    } },
  })
  const get = () => route.GET(new Request('http://localhost/api/share/sample'), { params: Promise.resolve({ token: 'sample' }) })
  beforeEach(() => { mime = 'image/png'; filename = 'sample.png' })
  it('forces relabeled HTML/XML and every case/parameter form of SVG to download', async () => {
    for (const value of ['text/html','application/xhtml+xml','text/xml','image/svg+xml','IMAGE/SVG+XML; charset=utf-8']) {
      mime = value
      const response = await get()
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-disposition')!, /^attachment;/, value)
      assert.equal(response.headers.get('content-type'), 'application/octet-stream', value)
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    }
  })
  it('preserves inline raster images, PDF and plain text with normalized MIME', async () => {
    for (const value of ['image/png','image/jpeg','image/webp','application/pdf','text/plain']) {
      mime = value.toUpperCase() + '; charset=utf-8'
      const response = await get()
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-disposition')!, /^inline;/)
      assert.equal(response.headers.get('content-type'), value)
    }
  })
  it('encodes untrusted filenames without quote or response-header injection', async () => {
    filename = 'a"\r\nX-Forged: yes.svg'
    const response = await get()
    assert.equal(response.status, 200)
    assert.equal(response.headers.has('x-forged'), false)
    assert.ok(!/[\r\n]/.test(response.headers.get('content-disposition')!))
  })
})
