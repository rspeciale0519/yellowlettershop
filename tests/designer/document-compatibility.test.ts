import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { normalizeDesignerDocument } from '../../lib/designer/document/normalize'
import { substituteDocument } from '../../components/designer/tokens/token-engine'
import type { DesignerDocument } from '../../types/designer'

const element = { id: 'a', name: 'Text', type: 'text' as const, x: 30, y: 40, width: 100, height: 60, zIndex: 1, content: '{{first_name}}', fontSize: 14, fontWeight: 'normal' as const, locked: true, rotation: 12 }
const legacy = { templateId: 'old', templateName: 'Old', orientation: 'portrait' as const, pages: { front: [element], back: [] }, backgrounds: { front: { color: '#ffeeaa' } }, updatedAt: 'now' }
describe('document compatibility', () => {
  it('upgrades front/back without losing transforms, locks, or backgrounds', () => {
    const doc = normalizeDesignerDocument(legacy) as Record<string, unknown>
    assert.equal(doc.version, 2)
    assert.deepEqual(doc.pageOrder, ['front', 'back'])
    assert.deepEqual(doc.pages, legacy.pages)
    assert.deepEqual(doc.backgrounds, legacy.backgrounds)
  })
  it('recovers elements-only documents instead of dropping their content', () => {
    const doc = normalizeDesignerDocument({ elements: [element] }) as Record<string, unknown>
    assert.deepEqual((doc.pages as Record<string, unknown>).front, [element])
  })
  it('rejects unknown versions and malformed content rather than resetting', () => {
    assert.throws(() => normalizeDesignerDocument({ ...legacy, version: 99 }))
    assert.throws(() => normalizeDesignerDocument({ ...legacy, pages: { front: 'broken', back: [] } }))
  })
  it('personalizes additional sides without deleting them', () => {
    const input = { ...legacy, pages: { ...legacy.pages, 'page-3': [element] } } as DesignerDocument
    const output = substituteDocument(input, { values: { first_name: 'Jane' } })
    assert.equal((output.pages as Record<string, typeof element[]>)['page-3']?.[0].content, 'Jane')
    assert.equal(element.content, '{{first_name}}')
  })
})
