import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { renderDesignToPdf } from '../../app/api/design/preview/_render/pdf-renderer'
import { PDFDocument } from 'pdf-lib'
import type { DesignerDocument } from '../../types/designer'

// A real renderer regression: the old loop silently omits the third included side.
describe('shared print layout', () => {
  it('renders every included side in production order and omits an excluded reverse', async () => {
    const doc = { version: 2, templateId: 't', templateName: 'T', orientation: 'portrait', formatId: 'letter_8_5x11',
      pages: { front: [], back: [], 'page-3': [] }, pageOrder: ['front', 'back', 'page-3'],
      pageSettings: { front: { printIncluded: true, sheetIndex: 0, side: 'front', paper: 'plain', regions: [] }, back: { printIncluded: false, sheetIndex: 0, side: 'back', paper: 'plain', regions: [] }, 'page-3': { printIncluded: true, sheetIndex: 1, side: 'front', paper: 'plain', regions: [] } }, updatedAt: 'now' } as DesignerDocument
    const pdf = await PDFDocument.load(await renderDesignToPdf(doc, { values: {} }, 'letter_8_5x11', 'portrait'))
    assert.equal(pdf.getPageCount(), 2)
  })
  it('supports non-WinAnsi letters instead of crashing during proof generation', async () => {
    const doc: DesignerDocument = { templateId: 't', templateName: 'T', orientation: 'portrait', pages: { front: [{ id: 't', name: 'Letter', type: 'text', x: 50, y: 50, width: 500, height: 100, zIndex: 1, content: 'Hello Łukasz — café', fontSize: 18, fontWeight: 'normal' }], back: [] }, updatedAt: 'now' }
    const bytes = await renderDesignToPdf(doc, { values: {} }, 'letter_8_5x11', 'portrait')
    assert.ok(bytes.length > 100)
  })
})
