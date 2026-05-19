import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { nudgeDelta } from '../../hooks/nudge'
import { computeSnap } from '../../components/designer/canvas/snap'
import type { DesignElement } from '../../types/designer'

describe('nudgeDelta', () => {
  it('moves 1px per arrow without shift', () => {
    assert.deepEqual(nudgeDelta('ArrowLeft', false), { dx: -1, dy: 0 })
    assert.deepEqual(nudgeDelta('ArrowRight', false), { dx: 1, dy: 0 })
    assert.deepEqual(nudgeDelta('ArrowUp', false), { dx: 0, dy: -1 })
    assert.deepEqual(nudgeDelta('ArrowDown', false), { dx: 0, dy: 1 })
  })
  it('moves 10px per arrow with shift', () => {
    assert.deepEqual(nudgeDelta('ArrowRight', true), { dx: 10, dy: 0 })
    assert.deepEqual(nudgeDelta('ArrowUp', true), { dx: 0, dy: -10 })
  })
  it('returns null for non-arrow keys', () => {
    assert.equal(nudgeDelta('a', false), null)
    assert.equal(nudgeDelta('Enter', true), null)
  })
})

describe('computeSnap', () => {
  const el = { id: 'a', type: 'graphic', x: 0, y: 0, width: 100, height: 100, zIndex: 1 } as unknown as DesignElement
  const canvas = { width: 800, height: 600 }

  it('snaps to canvas center and emits an x guide when within threshold', () => {
    // canvas center x = 400; element width 100 → centered left edge target 350.
    const r = computeSnap(el, 351, 10, [el], canvas)
    assert.equal(r.x, 350)
    assert.ok(r.guides.some((g) => g.axis === 'x' && g.position === 400))
  })

  it('does not snap (or guide) when far from any guide', () => {
    const r = computeSnap(el, 123, 211, [el], canvas)
    assert.equal(r.x, 123)
    assert.equal(r.y, 211)
    assert.equal(r.guides.length, 0)
  })
})
