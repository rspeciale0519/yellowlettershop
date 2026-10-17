import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { convertDesignerFormat, type FormatConversionResult } from '../../lib/designer/document/convert-format'
import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import { getPrintedPages } from '../../lib/designer/document/pages'
import { resolveOrderQuoteInputs } from '../../lib/orders/quote-inputs'
import type { DesignerDocumentV2 } from '../../types/designer-document'
import { POSTAGE_DEFAULTS } from '../../components/designer/postage'

const make = () => normalizeDesignerDocument({ templateId: 'test', templateName: 'Letter', orientation: 'portrait', formatId: 'letter_8_5x11', pages: { front: [{ id: 'body', name: 'Message', type: 'text', content: 'Keep this letter', x: 85, y: 110, width: 425, height: 220, fontSize: 18, fontWeight: 'normal', zIndex: 1, writingMode: 'guided', locked: true, rotation: 7 }], back: [] }, updatedAt: 'before' })
function success(result: FormatConversionResult) {
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error(result.error)
  return result
}
function extra(doc: DesignerDocumentV2, included: boolean) {
  doc.pageOrder.push('page-extra')
  doc.pages['page-extra'] = []
  doc.pageSettings['page-extra'] = { ...doc.pageSettings.front, printIncluded: included, sheetIndex: 1 }
  return doc
}
describe('safe designer format conversion', () => {
  it('includes both fixed postcard sides and satisfies the existing authoritative quote policy', () => {
    const source = make()
    assert.equal(source.pageSettings.back.printIncluded, false)
    const { document } = success(convertDesignerFormat(source, 'postcard_5x7'))
    assert.deepEqual(document.pageOrder, ['front', 'back'])
    assert.deepEqual(getPrintedPages(document).map(page => [page.id, page.sheetIndex, page.side]), [['front', 0, 'front'], ['back', 0, 'back']])
    const quote = resolveOrderQuoteInputs({ mailingOptions: { serviceLevel: 'full_service', mailPieceFormat: 'postcard_5x7' }, validatedQuantity: 10 }, document, { includedPrintedSides: 2, allowAdditionalPages: false, additionalPrintedSideCents: 10 })
    assert.equal(quote.printedSideCount, 2)
    assert.equal(quote.additionalSideChargeCents, 0)
    assert.equal(document.updatedAt, 'before', 'pure conversion leaves timestamping to the caller')
  })
  it('remaps front/back artwork while preserving writing, locks, rotation and source recovery', () => {
    const source = make()
    const body = source.pages.front[0]
    if (body.type === 'text') body.richText = { id: 'body', style: { fontSize: 18 }, paragraphs: [{ runs: [{ text: 'Keep this letter', style: { bold: true } }] }] }
    const before = structuredClone(source)
    const result = success(convertDesignerFormat(source, 'postcard_5x7'))
    const text = result.document.pages.front[0]
    assert.deepEqual([text.x, text.y, text.width, text.height], [50, 70, 250, 140])
    assert.equal(text.type === 'text' && text.writingMode, 'guided')
    assert.deepEqual(text.type === 'text' && text.richText, body.type === 'text' && body.richText)
    assert.equal(text.locked, true)
    assert.equal(text.rotation, 7)
    assert.deepEqual(source, before)
    assert.deepEqual(result.recoverySnapshot, source)
    result.document.pages.front[0].name = 'Changed'
    assert.equal(source.pages.front[0].name, 'Message')
    assert.equal(result.recoverySnapshot.pages.front[0].name, 'Message')
  })
  it('trims excluded empty extra sides only from the postcard, keeping a detached recovery snapshot', () => {
    const source = extra(make(), false)
    const result = success(convertDesignerFormat(source, 'postcard_4x6'))
    assert.deepEqual(Object.keys(result.document.pages), ['front', 'back'])
    assert.deepEqual(Object.keys(result.document.pageSettings), ['front', 'back'])
    assert.ok(result.recoverySnapshot.pages['page-extra'])
    assert.notEqual(result.recoverySnapshot, source)
    assert.deepEqual(source.pageOrder, ['front', 'back', 'page-extra'])
  })
  it('refuses more than two included sides even if the third side is empty', () => {
    const source = extra(make(), true)
    source.pageSettings.back.printIncluded = true
    const before = structuredClone(source)
    const result = convertDesignerFormat(source, 'postcard_5x7')
    assert.equal(result.ok, false)
    if (result.ok) throw new Error('Expected refusal')
    assert.equal(result.code, 'too-many-printed-sides')
    assert.match(result.error, /exclude|remove/i)
    assert.deepEqual(source, before)
  })
  it('refuses artwork on an excluded extra side, including hidden objects', () => {
    const source = extra(make(), false)
    source.pages['page-extra'] = [{ ...source.pages.front[0], hidden: true }]
    const before = structuredClone(source)
    const result = convertDesignerFormat(source, 'postcard_4x6')
    assert.equal(result.ok, false)
    if (result.ok) throw new Error('Expected refusal')
    assert.equal(result.code, 'extra-side-artwork')
    assert.deepEqual(result.pageIds, ['page-extra'])
    assert.match(result.error, /move|clear/i)
    assert.deepEqual(source, before)
  })
  it('refuses colored backgrounds, images or ruled paper on extra sides instead of dropping them', () => {
    for (const background of [{ color: '#ff0000' }, { image: { src: 'https://example.test/art.png', fit: 'cover' as const } }, undefined]) {
      const source = extra(make(), false)
      if (background) source.backgrounds = { 'page-extra': background }
      if (!background) source.pageSettings['page-extra'].paper = 'yellow-notepad'
      const result = convertDesignerFormat(source, 'postcard_5x7')
      assert.equal(result.ok, false)
      if (!result.ok) assert.equal(result.code, 'extra-side-artwork')
    }
  })
  it('keeps postage footprints at their physical dimensions and inside target safe bounds', () => {
    const source = make()
    source.pages.back = [{ id: 'stamp', name: 'Stamp', type: 'postage', kind: 'stamp', x: 730, y: 24, width: 96, height: 108, zIndex: 1, locked: true }]
    const { document } = success(convertDesignerFormat(source, 'postcard_5x7'))
    const stamp = document.pages.back[0]
    assert.equal(stamp.width, POSTAGE_DEFAULTS.stamp.width)
    assert.equal(stamp.height, POSTAGE_DEFAULTS.stamp.height)
    assert.ok(stamp.x >= 12.5 && stamp.x + stamp.width <= 487.5)
    assert.ok(stamp.y >= 12.5 && stamp.y + stamp.height <= 687.5)
    assert.equal(stamp.locked, true)
  })
  it('retains extra letter sides, settings and artwork when switching to folded letters', () => {
    const source = extra(make(), true)
    source.pages['page-extra'] = [{ ...source.pages.front[0], name: 'Third side' }]
    source.pageSettings['page-extra'].paper = 'yellow-notepad'
    const { document } = success(convertDesignerFormat(source, 'letter_folded'))
    assert.equal(document.formatId, 'letter_folded')
    assert.deepEqual(document.pages, source.pages)
    assert.deepEqual(document.pageOrder, source.pageOrder)
    assert.deepEqual(document.pageSettings, source.pageSettings)
  })
})
