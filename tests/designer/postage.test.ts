import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  rectsOverlap,
  availablePostageKinds,
  defaultPostagePosition,
  violatesKeepClear,
  POSTAGE_KINDS,
  POSTAGE_DEFAULTS,
} from '../../components/designer/postage'

describe('rectsOverlap', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 }
  it('true when boxes intersect', () => {
    assert.equal(rectsOverlap(a, { x: 50, y: 50, width: 100, height: 100 }), true)
  })
  it('false when edge-touching (no positive area)', () => {
    assert.equal(rectsOverlap(a, { x: 100, y: 0, width: 50, height: 50 }), false)
  })
  it('false when fully separated', () => {
    assert.equal(rectsOverlap(a, { x: 200, y: 200, width: 10, height: 10 }), false)
  })
})

describe('availablePostageKinds (singleton + mutual exclusion)', () => {
  it('both available when no postage placed', () => {
    assert.deepEqual(availablePostageKinds([{ type: 'text' }]), POSTAGE_KINDS)
  })
  it('none available once a stamp exists', () => {
    assert.deepEqual(availablePostageKinds([{ type: 'postage' }, { type: 'text' }]), [])
  })
})

describe('violatesKeepClear', () => {
  const stamp = { id: 'p', type: 'postage', x: 0, y: 0, width: 100, height: 100 }
  const text = { id: 't', type: 'text', x: 0, y: 0, width: 100, height: 100 }
  it('blocks a non-postage element moving onto a postage box', () => {
    assert.equal(violatesKeepClear(text, { x: 50, y: 50, width: 100, height: 100 }, [stamp]), true)
  })
  it('blocks a postage element moving onto a non-postage element', () => {
    assert.equal(violatesKeepClear(stamp, { x: 50, y: 50, width: 100, height: 100 }, [text]), true)
  })
  it('allows non-postage overlapping non-postage (normal stacking)', () => {
    const other = { id: 'o', type: 'graphic', x: 0, y: 0, width: 100, height: 100 }
    assert.equal(violatesKeepClear(text, { x: 50, y: 50, width: 100, height: 100 }, [other]), false)
  })
  it('ignores self and non-overlapping boxes', () => {
    assert.equal(violatesKeepClear(text, { x: 300, y: 300, width: 10, height: 10 }, [stamp, text]), false)
  })
})

describe('defaultPostagePosition', () => {
  it('places top-right inside the margin', () => {
    const pos = defaultPostagePosition('indicia', { width: 600, height: 900 })
    assert.equal(pos.y, 24)
    assert.equal(pos.x, 600 - 24 - POSTAGE_DEFAULTS.indicia.width)
  })
})
