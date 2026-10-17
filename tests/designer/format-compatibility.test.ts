import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { MAIL_PIECE_FORMATS } from '../../lib/orders/mail-formats'
import { DEFAULT_PRICING, calculatePricing } from '../../lib/orders/pricing'
import { documentSchema } from '../../lib/designer/document/schema'
import { layoutDesignerDocument } from '../../lib/designer/text/layout'
import { getServerFontMetrics } from '../../lib/designer/text/server-fonts'
import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import { MAIL_FORMATS, canvasSizePx, printSizePx, specRectsPx, isMailFormatId } from '../../components/designer/mail-spec'
import { formatStock } from '../../components/design-preview-3d/format-stocks'

const document = { templateId: 'test', templateName: 'Test', orientation: 'portrait', pages: { front: [], back: [] }, updatedAt: 'now' }
describe('checkout format compatibility', () => {
  it('offers and validates every existing checkout format in the designer', () => {
    assert.deepEqual(Object.keys(MAIL_FORMATS).sort(), [...MAIL_PIECE_FORMATS].sort())
    for (const formatId of MAIL_PIECE_FORMATS) assert.ok(documentSchema.safeParse({ ...document, formatId }).success, formatId)
  })
  it('recognizes 5x7 and folded letters without treating object prototype names as formats', () => {
    assert.equal(isMailFormatId('postcard_5x7'), true)
    assert.equal(isMailFormatId('letter_folded'), true)
    assert.equal(isMailFormatId('constructor'), false)
    assert.equal(isMailFormatId('toString'), false)
  })
  it('uses the existing 5x7 physical dimensions in both orientations and print DPI', () => {
    assert.deepEqual(canvasSizePx('postcard_5x7', 'portrait'), { width: 500, height: 700 })
    assert.deepEqual(canvasSizePx('postcard_5x7', 'landscape'), { width: 700, height: 500 })
    assert.deepEqual(printSizePx('postcard_5x7', 'portrait'), { width: 1500, height: 2100 })
    assert.deepEqual(specRectsPx('postcard_5x7', 'portrait'), { trim: { x: 0, y: 0, w: 500, h: 700 }, bleed: { x: -12.5, y: -12.5, w: 525, h: 725 }, safe: { x: 12.5, y: 12.5, w: 475, h: 675 } })
  })
  it('keeps folded letter artwork flat at letter dimensions with existing letter margins', () => {
    assert.equal(MAIL_FORMATS.letter_folded.isLetter, true)
    for (const orientation of ['portrait', 'landscape'] as const) {
      assert.deepEqual(canvasSizePx('letter_folded', orientation), canvasSizePx('letter_8_5x11', orientation))
      assert.deepEqual(printSizePx('letter_folded', orientation), printSizePx('letter_8_5x11', orientation))
      assert.deepEqual(specRectsPx('letter_folded', orientation), specRectsPx('letter_8_5x11', orientation))
    }
  })
  it('gives both formats a physical 3D stock and finite stage scale', () => {
    for (const id of ['postcard_5x7', 'letter_folded'] as const) {
      const stock = formatStock(id, 'landscape')
      const size = canvasSizePx(id, 'landscape')
      assert.equal(stock.widthIn * 100, size.width)
      assert.equal(stock.heightIn * 100, size.height)
      assert.ok(Number.isFinite(stock.unitsPerInch) && stock.unitsPerInch > 0)
    }
  })
  it('normalizes and lays out guided text for every offered format without losing writing content', async () => {
    const metrics = await getServerFontMetrics()
    const text = { id: 'body', name: 'Message', type: 'text', content: 'Hello', x: 40, y: 50, width: 200, height: 100, zIndex: 1, fontSize: 18, fontWeight: 'normal', writingMode: 'guided', richText: { id: 'story', style: { fontSize: 18 }, paragraphs: [{ runs: [{ text: 'Hello', style: { bold: true } }] }] } }
    for (const formatId of MAIL_PIECE_FORMATS) {
      const result = normalizeDesignerDocument({ ...document, formatId, pages: { front: [text], back: [] } })
      assert.equal(result.formatId, formatId)
      assert.deepEqual(result.pages.front[0], text)
      const layout = layoutDesignerDocument(result, {}, metrics)
      assert.equal(layout.boxes['front:body'].runs.map(run => run.text).join(''), 'Hello')
      assert.deepEqual(layout.issues, [])
    }
  })
  it('retains the commercial 65c postcard and 95c folded-letter printing rates', () => {
    assert.equal(DEFAULT_PRICING.printing.postcard_5x7, 65)
    assert.equal(DEFAULT_PRICING.printing.letter_folded, 95)
    assert.equal(calculatePricing({ serviceLevel: 'full_service', mailPieceFormat: 'postcard_5x7' }, 10).printing, 6.5)
    assert.equal(calculatePricing({ serviceLevel: 'full_service', mailPieceFormat: 'letter_folded' }, 10).printing, 9.5)
  })
})
