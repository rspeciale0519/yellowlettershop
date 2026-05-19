import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  addRow,
  removeRow,
  addColumn,
  removeColumn,
  toggleHeader,
} from '../../components/designer/inspector/table-ops'

const base = {
  rows: 2,
  columns: 2,
  cells: [
    ['Name', 'Value'],
    ['Phone', '555'],
  ],
  headerRow: true as boolean,
}

describe('table-ops (pure, rectangular-preserving)', () => {
  it('addRow appends an empty row matching column count', () => {
    const out = addRow(base)
    assert.equal(out.rows, 3)
    assert.equal(out.columns, 2)
    assert.deepEqual(out.cells[2], ['', ''])
  })

  it('addColumn appends an empty cell to every row', () => {
    const out = addColumn(base)
    assert.equal(out.columns, 3)
    assert.equal(out.cells.every((r) => r.length === 3), true)
    assert.deepEqual(out.cells[0], ['Name', 'Value', ''])
  })

  it('removeRow / removeColumn drop the last and never go below 1', () => {
    assert.equal(removeRow(base).rows, 1)
    assert.equal(removeColumn(base).columns, 1)
    const oneRow = { rows: 1, columns: 1, cells: [['x']] }
    assert.deepEqual(removeRow(oneRow), { rows: 1, columns: 1, cells: [['x']] })
    assert.deepEqual(removeColumn(oneRow), { rows: 1, columns: 1, cells: [['x']] })
  })

  it('toggleHeader flips headerRow', () => {
    assert.deepEqual(toggleHeader(base), { headerRow: false })
    assert.deepEqual(toggleHeader({ ...base, headerRow: false }), { headerRow: true })
  })
})
