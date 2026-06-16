import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { alignToPage } from '../../components/designer/canvas/alignment'

describe('alignToPage', () => {
  const box = { x: 50, y: 50, width: 100, height: 40 }
  const canvas = { width: 800, height: 600 }

  it('aligns left and top to the page origin', () => {
    assert.deepEqual(alignToPage(box, canvas, 'left'), { x: 0 })
    assert.deepEqual(alignToPage(box, canvas, 'top'), { y: 0 })
  })

  it('centers horizontally and vertically on the page', () => {
    assert.deepEqual(alignToPage(box, canvas, 'center'), { x: 350 })
    assert.deepEqual(alignToPage(box, canvas, 'middle'), { y: 280 })
  })

  it('aligns right and bottom to the far edge minus the box size', () => {
    assert.deepEqual(alignToPage(box, canvas, 'right'), { x: 700 })
    assert.deepEqual(alignToPage(box, canvas, 'bottom'), { y: 560 })
  })

  it('only returns the relevant axis per direction', () => {
    assert.deepEqual(Object.keys(alignToPage(box, canvas, 'left')), ['x'])
    assert.deepEqual(Object.keys(alignToPage(box, canvas, 'bottom')), ['y'])
  })
})
