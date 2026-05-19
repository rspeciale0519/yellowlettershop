import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  DESIGN_PPI,
  PRINT_DPI,
  PRINT_SCALE,
  LEGACY_CANVAS,
  MAIL_FORMATS,
  DEFAULT_MAIL_FORMAT,
  LEGACY_FALLBACK_FORMAT,
  canvasSizePx,
  printSizePx,
  specRectsPx,
  withFormatId,
  remapElements,
} from '../../components/designer/mail-spec'

describe('mail-spec constants', () => {
  it('uses a 100 px/in design space and 300 DPI print (scale 3)', () => {
    assert.equal(DESIGN_PPI, 100)
    assert.equal(PRINT_DPI, 300)
    assert.equal(PRINT_SCALE, 3)
    assert.deepEqual(LEGACY_CANVAS, { width: 862, height: 1112 })
  })

  it('defines exactly the four approved formats with the legacy fallback = letter', () => {
    assert.deepEqual(
      Object.keys(MAIL_FORMATS).sort(),
      ['letter_8_5x11', 'postcard_4x6', 'postcard_6x11', 'postcard_6x9'].sort(),
    )
    assert.ok(MAIL_FORMATS[DEFAULT_MAIL_FORMAT])
    assert.equal(LEGACY_FALLBACK_FORMAT, 'letter_8_5x11')
    assert.equal(MAIL_FORMATS.letter_8_5x11.isLetter, true)
    assert.equal(MAIL_FORMATS.postcard_4x6.isLetter, false)
  })
})

describe('canvasSizePx / printSizePx', () => {
  it('= inches x 100 (portrait), swapped for landscape', () => {
    assert.deepEqual(canvasSizePx('postcard_4x6', 'portrait'), { width: 400, height: 600 })
    assert.deepEqual(canvasSizePx('postcard_4x6', 'landscape'), { width: 600, height: 400 })
    assert.deepEqual(canvasSizePx('postcard_6x9', 'portrait'), { width: 600, height: 900 })
    assert.deepEqual(canvasSizePx('postcard_6x11', 'portrait'), { width: 600, height: 1100 })
    assert.deepEqual(canvasSizePx('letter_8_5x11', 'portrait'), { width: 850, height: 1100 })
  })

  it('print size = canvas px x 3 (300 DPI)', () => {
    assert.deepEqual(printSizePx('postcard_4x6', 'portrait'), { width: 1200, height: 1800 })
    assert.deepEqual(printSizePx('letter_8_5x11', 'portrait'), { width: 2550, height: 3300 })
  })
})

describe('specRectsPx', () => {
  it('produces trim/bleed/safe with correct insets, and address+indicia inside trim', () => {
    const r = specRectsPx('postcard_4x6', 'portrait') // 400 x 600 trim
    assert.deepEqual(r.trim, { x: 0, y: 0, w: 400, h: 600 })
    // bleed 0.125in = 12.5px outside the trim on every side
    assert.deepEqual(r.bleed, { x: -12.5, y: -12.5, w: 425, h: 625 })
    // safe 0.125in = 12.5px inside
    assert.deepEqual(r.safe, { x: 12.5, y: 12.5, w: 375, h: 575 })
    for (const zone of [r.address, r.indicia]) {
      assert.ok(zone.w > 0 && zone.h > 0, 'zone has positive size')
      assert.ok(zone.x >= 0 && zone.y >= 0, 'zone inside trim (origin)')
      assert.ok(zone.x + zone.w <= r.trim.w, 'zone within trim width')
      assert.ok(zone.y + zone.h <= r.trim.h, 'zone within trim height')
    }
  })

  it('letter uses a wider safe margin than postcards', () => {
    const letter = specRectsPx('letter_8_5x11', 'portrait')
    assert.ok(letter.safe.x > 12.5, 'letter safe inset > postcard 12.5')
  })
})

describe('withFormatId (back-compat, no reflow)', () => {
  it('defaults a doc missing formatId to legacy letter, untouched otherwise', () => {
    const out = withFormatId({ templateId: 't', pages: { front: [], back: [] } })
    assert.equal(out.formatId, 'letter_8_5x11')
    assert.equal(out.templateId, 't')
  })
  it('keeps a valid existing formatId', () => {
    const out = withFormatId({ formatId: 'postcard_6x9' })
    assert.equal(out.formatId, 'postcard_6x9')
  })
  it('replaces an invalid formatId with the legacy fallback', () => {
    const out = withFormatId({ formatId: 'bogus' as never })
    assert.equal(out.formatId, 'letter_8_5x11')
  })
})

describe('remapElements', () => {
  it('scales x/y/width/height proportionally between canvas spaces', () => {
    const els = [{ id: 'a', x: 100, y: 200, width: 50, height: 40, zIndex: 1 }]
    const out = remapElements(els, { width: 1000, height: 1000 }, { width: 500, height: 2000 })
    assert.equal(out[0].x, 50) // 100 * 0.5
    assert.equal(out[0].y, 400) // 200 * 2
    assert.equal(out[0].width, 25)
    assert.equal(out[0].height, 80)
    assert.equal(out[0].id, 'a')
  })
  it('is an identity map when from === to', () => {
    const els = [{ id: 'a', x: 10, y: 20, width: 30, height: 40, zIndex: 2 }]
    const out = remapElements(els, { width: 800, height: 600 }, { width: 800, height: 600 })
    assert.deepEqual(out, els)
  })
})
