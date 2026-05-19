import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  DND_MIME,
  setDragPayload,
  readDragPayload,
  dropPointToCanvas,
} from '../../components/designer/dnd'

function fakeDataTransfer() {
  const store: Record<string, string> = {}
  return {
    effectAllowed: '',
    setData(type: string, val: string) {
      store[type] = val
    },
    getData(type: string) {
      return store[type] ?? ''
    },
  }
}

describe('dnd payload codec', () => {
  it('round-trips a module payload', () => {
    const dt = fakeDataTransfer()
    setDragPayload(dt as unknown as DataTransfer, { kind: 'module', moduleId: 'heading' })
    assert.equal(dt.effectAllowed, 'copy')
    assert.deepEqual(readDragPayload(dt as unknown as DataTransfer), {
      kind: 'module',
      moduleId: 'heading',
    })
  })

  it('round-trips an asset payload', () => {
    const dt = fakeDataTransfer()
    const asset = { id: 'a1', name: 'Logo', url: 'u', sourceUrl: 's' }
    setDragPayload(dt as unknown as DataTransfer, { kind: 'asset', asset })
    const out = readDragPayload(dt as unknown as DataTransfer)
    assert.equal(out?.kind, 'asset')
    if (out?.kind === 'asset') assert.deepEqual(out.asset, asset)
  })

  it('returns null for empty/garbage data', () => {
    const dt = fakeDataTransfer()
    assert.equal(readDragPayload(dt as unknown as DataTransfer), null)
    dt.setData(DND_MIME, '{not json')
    assert.equal(readDragPayload(dt as unknown as DataTransfer), null)
  })

  it('accepts the legacy application/x-yls-module mime', () => {
    const dt = fakeDataTransfer()
    dt.setData('application/x-yls-module', 'shape')
    assert.deepEqual(readDragPayload(dt as unknown as DataTransfer), {
      kind: 'module',
      moduleId: 'shape',
    })
  })
})

describe('dropPointToCanvas', () => {
  const rect = { left: 100, top: 50 } as DOMRect

  it('maps client coords to canvas space at scale 1, no pan', () => {
    assert.deepEqual(
      dropPointToCanvas({ clientX: 300, clientY: 250 }, rect, { x: 0, y: 0 }, 1),
      { x: 200, y: 200 },
    )
  })

  it('accounts for zoom scale and pan', () => {
    assert.deepEqual(
      dropPointToCanvas({ clientX: 300, clientY: 250 }, rect, { x: 20, y: 10 }, 2),
      { x: (300 - 100 - 20) / 2, y: (250 - 50 - 10) / 2 },
    )
  })
})
