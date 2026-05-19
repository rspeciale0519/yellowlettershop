import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  createDesignerDocument,
  DESIGN_TEMPLATES,
} from '../../components/designer/designer-templates'
import { MAIL_FORMATS, canvasSizePx } from '../../components/designer/mail-spec'

describe('createDesignerDocument — format assignment + coord remap', () => {
  it('assigns a valid per-template formatId (postcard vs letter)', () => {
    assert.equal(createDesignerDocument('postcard-offer').formatId, 'postcard_6x9')
    assert.equal(createDesignerDocument('yellow-letter').formatId, 'letter_8_5x11')
    assert.equal(createDesignerDocument('real-estate-flyer').formatId, 'letter_8_5x11')
  })

  it('default document has a formatId that is a real MAIL_FORMATS key', () => {
    const doc = createDesignerDocument()
    assert.ok(doc.formatId && doc.formatId in MAIL_FORMATS)
    assert.equal(doc.orientation, 'portrait')
  })

  it('remaps every template element inside the target canvas bounds', () => {
    for (const tpl of DESIGN_TEMPLATES) {
      const doc = createDesignerDocument(tpl.id)
      const size = canvasSizePx(doc.formatId!, 'portrait')
      for (const page of ['front', 'back'] as const) {
        for (const el of doc.pages[page]) {
          assert.ok(el.x >= 0 && el.y >= 0, `${tpl.id}/${el.id} origin >= 0`)
          assert.ok(
            el.x + el.width <= size.width + 0.001,
            `${tpl.id}/${el.id} within width`,
          )
          assert.ok(
            el.y + el.height <= size.height + 0.001,
            `${tpl.id}/${el.id} within height`,
          )
        }
      }
    }
  })

  it('preserves element identity/content through the remap', () => {
    const doc = createDesignerDocument('yellow-letter')
    const greeting = doc.pages.front.find((e) => e.id === 'letter-greeting')
    assert.ok(greeting)
    assert.equal((greeting as { content?: string }).content, 'Dear {{first_name}},')
  })
})
