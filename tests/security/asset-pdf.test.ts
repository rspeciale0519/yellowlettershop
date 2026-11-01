import { strict as assert } from 'assert'
import { PDFDocument, PDFRawStream, PDFName } from 'pdf-lib'
import QRCode from 'qrcode'
import { loadWithMocks } from '../helpers/module-mocks'
import type { DesignerDocument } from '../../types/designer'

describe('owner-aware PDF asset downloads', () => {
  let owner: string, path: string, downloads: string[], png: Buffer
  const client = {
    from: () => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { user_id: owner, file_path: path, file_type: 'image' }, error: null }) }; return q },
    storage: { from: () => ({ download: async (filePath: string) => { downloads.push(filePath); return { data: new Blob([Uint8Array.from(png)]), error: null } } }) },
  }
  const imageLoader = loadWithMocks<typeof import('../../lib/designer/fetch-image-bytes')>('../../lib/designer/fetch-image-bytes', {
    '../../utils/supabase/service': { createServiceClient: () => client },
  })
  const renderer = loadWithMocks<typeof import('../../app/api/design/preview/_render/pdf-renderer')>('../../app/api/design/preview/_render/pdf-renderer', {
    '../../lib/designer/fetch-image-bytes': imageLoader,
  })
  const document = { pages: { front: [{ id: 'image', name: 'Owned asset', type: 'image', src: 'https://yls.invalid/assets/images/asset-id', x: 0, y: 0, width: 100, height: 100, zIndex: 0 }], back: [] }, orientation: 'portrait' } as DesignerDocument
  beforeEach(async () => { owner = 'owner'; path = 'owner/image.png'; downloads = []; png = await QRCode.toBuffer('local sample image', { width: 64 }) })
  async function render(ownerUserId?: string) {
    const bytes = await renderer.renderDesignToPdf(document, {}, 'letter_8_5x11', 'portrait', { ownerUserId })
    const pdf = await PDFDocument.load(bytes)
    return pdf.context.enumerateIndirectObjects().filter(([, obj]) => obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype'))?.toString() === '/Image').length
  }
  it('embeds the owner’s image in-process without HTTP cookies or public access', async () => {
    const previous = globalThis.fetch
    globalThis.fetch = async () => { throw new Error('Cookie-less HTTP image fetch must not be used') }
    try { assert.ok(await render('owner') > 0); assert.deepEqual(downloads, ['owner/image.png']) }
    finally { globalThis.fetch = previous }
  })
  it('also embeds the historical assets/owner namespace', async () => {
    path = 'assets/owner/image.png'
    assert.ok(await render('owner') > 0); assert.deepEqual(downloads, [path])
  })
  it('never downloads another customer’s row or a forged owned foreign path', async () => {
    owner = 'other'; path = 'other/image.png'
    assert.equal(await render('owner'), 0)
    owner = 'owner'
    assert.equal(await render('owner'), 0)
    assert.deepEqual(downloads, [])
  })
  it('requires trusted caller identity even if the row is otherwise valid', async () => {
    assert.equal(await render(), 0); assert.deepEqual(downloads, [])
  })
})
