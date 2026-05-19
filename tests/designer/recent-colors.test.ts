import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { pushRecentColor } from '../../components/designer/inspector/use-recent-colors'

describe('pushRecentColor (MRU ring buffer)', () => {
  it('adds to the front of an empty list', () => {
    assert.deepEqual(pushRecentColor([], '#facc15'), ['#facc15'])
  })

  it('moves an existing color to the front without duplicating (case-insensitive)', () => {
    assert.deepEqual(
      pushRecentColor(['#111827', '#FACC15', '#ffffff'], '#facc15'),
      ['#facc15', '#111827', '#ffffff'],
    )
  })

  it('caps the list at the max (default 8), dropping the oldest', () => {
    const eight = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']
    const out = pushRecentColor(eight, '#new')
    assert.equal(out.length, 8)
    assert.equal(out[0], '#new')
    assert.equal(out.includes('c8'), false) // oldest dropped
  })

  it('returns the list unchanged for an empty/blank color', () => {
    assert.deepEqual(pushRecentColor(['#abc'], '   '), ['#abc'])
    assert.deepEqual(pushRecentColor(['#abc'], ''), ['#abc'])
  })

  it('respects a custom max', () => {
    assert.deepEqual(pushRecentColor(['a', 'b', 'c'], 'd', 3), ['d', 'a', 'b'])
  })
})
