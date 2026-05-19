import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { PDFDocument } from 'pdf-lib'
import { hexToRgb01 } from '../../app/api/design/preview/_render/colors'
import { renderDesignToPdf } from '../../app/api/design/preview/_render/pdf-renderer'
import { buildTokenContext } from '../../components/designer/tokens/recipient-map'
import type { DesignerDocument } from '../../types/designer'

describe('hexToRgb01', () => {
  it('parses #rrggbb to 0..1 channels', () => {
    assert.deepEqual(hexToRgb01('#ffffff'), { r: 1, g: 1, b: 1 })
    assert.deepEqual(hexToRgb01('#000000'), { r: 0, g: 0, b: 0 })
    const y = hexToRgb01('#facc15')
    assert.ok(Math.abs(y.r - 250 / 255) < 1e-6 && Math.abs(y.g - 204 / 255) < 1e-6)
  })
  it('supports #rgb shorthand and falls back to black on garbage', () => {
    assert.deepEqual(hexToRgb01('#fff'), { r: 1, g: 1, b: 1 })
    assert.deepEqual(hexToRgb01('nope'), { r: 0, g: 0, b: 0 })
  })
})

describe('renderDesignToPdf', () => {
  const doc: DesignerDocument = {
    templateId: 't',
    templateName: 'T',
    orientation: 'portrait',
    formatId: 'postcard_4x6',
    pages: {
      front: [
        { id: 'h', name: 'h', type: 'text', x: 50, y: 50, width: 200, height: 40, zIndex: 1, content: 'Hi {{first_name}}', fontSize: 18, fontWeight: 'bold' },
        { id: 'g', name: 'g', type: 'graphic', x: 10, y: 10, width: 80, height: 30, zIndex: 0, shape: 'rectangle', fill: '#facc15' },
      ],
      back: [
        { id: 'b', name: 'b', type: 'text', x: 20, y: 20, width: 200, height: 30, zIndex: 1, content: 'Back', fontSize: 14, fontWeight: 'normal' },
      ],
    },
    backgrounds: { front: { color: '#112233' } },
    updatedAt: 'now',
  }
  const ctx = buildTokenContext(
    { id: 'r', firstName: 'Jane', lastName: 'Doe', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', company: '', email: '', phone: '' },
    {},
  )

  it('produces a valid 2-page PDF sized to trim+bleed at 72pt/in', async () => {
    const bytes = await renderDesignToPdf(doc, ctx, 'postcard_4x6', 'portrait', { addCropMarks: true })
    assert.ok(bytes instanceof Uint8Array && bytes.length > 100)
    assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-')
    const pdf = await PDFDocument.load(bytes)
    assert.equal(pdf.getPageCount(), 2)
    const { width, height } = pdf.getPage(0).getSize()
    // 4x6 trim + 0.125" bleed each side => 4.25 x 6.25 in => *72pt
    assert.ok(Math.abs(width - 4.25 * 72) < 0.5)
    assert.ok(Math.abs(height - 6.25 * 72) < 0.5)
  })

  it('embeds a data-URL image and a QR element without throwing', async () => {
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const withMedia: DesignerDocument = {
      ...doc,
      pages: {
        front: [
          { id: 'img', name: 'img', type: 'image', x: 5, y: 5, width: 60, height: 60, zIndex: 1, src: png, fit: 'cover' },
          { id: 'qr', name: 'qr', type: 'qr', x: 80, y: 5, width: 50, height: 50, zIndex: 2, value: 'https://x/{{state}}', foreground: '#000000', background: '#ffffff' },
        ],
        back: [],
      },
    }
    const bytes = await renderDesignToPdf(withMedia, ctx, 'postcard_6x9', 'landscape')
    const pdf = await PDFDocument.load(bytes)
    assert.equal(pdf.getPageCount(), 2)
  })
})
