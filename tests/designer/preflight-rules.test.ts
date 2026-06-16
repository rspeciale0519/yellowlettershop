import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { runPreflight } from '../../components/designer/preflight/preflight-rules'
import { specRectsPx } from '../../components/designer/mail-spec'
import type { DesignElement } from '../../types/designer'

const spec = specRectsPx('postcard_4x6', 'portrait') // trim 400x600, safe inset 12.5

function el(p: Partial<DesignElement> & { id: string; type: DesignElement['type'] }): DesignElement {
  return { name: p.id, x: 100, y: 100, width: 80, height: 40, zIndex: 1, ...p } as DesignElement
}

describe('runPreflight', () => {
  it('flags placeholder image, empty text, and tiny font', () => {
    const issues = runPreflight(
      [
        el({ id: 'ph', type: 'image', src: 'placeholder:Logo' }),
        el({ id: 'txt', type: 'text', content: '   ', fontSize: 18, fontWeight: 'normal' }),
        el({ id: 'small', type: 'text', content: 'hi', fontSize: 4, fontWeight: 'normal' }),
      ],
      { specRects: spec },
    )
    assert.ok(issues.some((i) => i.elementId === 'ph' && i.rule === 'placeholder'))
    assert.ok(issues.some((i) => i.elementId === 'txt' && i.rule === 'empty-text'))
    assert.ok(issues.some((i) => i.elementId === 'small' && i.severity === 'error' && i.rule === 'tiny-font'))
  })

  it('flags content outside the safe area', () => {
    const outside = el({ id: 'oob', type: 'graphic', x: 0, y: 0, width: 5, height: 5, shape: 'rectangle', fill: '#000' } as Partial<DesignElement> & { id: string; type: 'graphic' })
    const issues = runPreflight([outside], { specRects: spec })
    assert.ok(issues.some((i) => i.elementId === 'oob' && i.rule === 'out-of-safe'))
  })

  it('flags a low-resolution image (natural px < required at 300 DPI)', () => {
    const issues = runPreflight([el({ id: 'img', type: 'image', src: 'http://x/p.png', width: 200, height: 200 })], {
      specRects: spec,
      naturalSizes: { img: { w: 100, h: 100 } }, // need ~600px (200/100in*300)
    })
    assert.ok(issues.some((i) => i.elementId === 'img' && i.rule === 'low-dpi' && i.severity === 'error'))
  })

  it('flags unknown personalization tokens', () => {
    const issues = runPreflight(
      [el({ id: 't', type: 'text', content: 'Hi {{first_name}} {{bogus_field}}', fontSize: 16, fontWeight: 'normal' })],
      { specRects: spec, knownTokens: new Set(['first_name']) },
    )
    assert.ok(issues.some((i) => i.rule === 'unknown-token' && i.message.includes('bogus_field')))
    assert.ok(!issues.some((i) => i.message.includes('first_name')))
  })

  it('returns no issues for a clean element', () => {
    const issues = runPreflight(
      [el({ id: 'ok', type: 'text', x: 150, y: 200, width: 100, height: 30, content: 'Hello', fontSize: 16, fontWeight: 'normal' })],
      { specRects: spec },
    )
    assert.equal(issues.length, 0)
  })
})
