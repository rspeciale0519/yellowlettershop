import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { saveDesignForUser } from '../../lib/designer/save-design-server'
import { documentRevision } from '../../lib/designer/content-revision'
import { doc } from './draft-context.test'

const orderId = '00000000-0000-4000-8000-000000000001'
const designId = '00000000-0000-4000-8000-000000000002'
type Row = Record<string, unknown>
function mockDatabase(rows: Record<string, Row[]>, failLink = false) {
  const writes: { table: string; values: Row }[] = []
  const database = {
    from(table: string) {
      let values: Row | undefined
      let insert = false
      const filters: [string, unknown][] = []
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return chain },
        is: (key: string, value: unknown) => { filters.push([key, value]); return chain },
        insert: (next: Row) => { values = next; insert = true; return chain },
        update: (next: Row) => { values = next; return chain },
        maybeSingle: async () => {
          if (values) writes.push({ table, values })
          if (values && table !== 'saved_designs' && failLink) return { data: null, error: { message: 'link failed' } }
          let row = (rows[table] ?? []).find(candidate => filters.every(([key, value]) => candidate[key] === value))
          if (insert) { row = { id: designId, ...values }; (rows[table] ??= []).push(row) }
          else if (row && values) Object.assign(row, values)
          return { data: row ?? null, error: null }
        },
      }
      return chain
    },
  }
  return { database: database as unknown as Parameters<typeof saveDesignForUser>[0], writes }
}
describe('design persistence ownership and linkage', () => {
  it('does not change submitted artwork or reopen an inactive wizard draft', async () => {
    for (const rows of [
      { orders: [{ id: orderId, created_by: 'alice', status: 'submitted', metadata: null }] },
      { order_drafts: [{ id: orderId, user_id: 'alice', status: 'submitted', order_state: {} }] },
    ]) {
      const { database, writes } = mockDatabase(rows)
      const result = await saveDesignForUser(database, 'alice', { designState: doc, orderId })
      assert.equal(result.status, 409)
      assert.equal(writes.length, 0)
    }
  })
  it('rejects a foreign or nonexistent order before persisting a design', async () => {
    const { database, writes } = mockDatabase({ orders: [{ id: orderId, created_by: 'bob' }] })
    const result = await saveDesignForUser(database, 'alice', { designState: doc, orderId })
    assert.equal(result.status, 404)
    assert.equal(result.body.ok, false)
    assert.equal(writes.length, 0)
  })
  it('retains all completed draft steps while linking the actual id and canonical revision', async () => {
    const rows = { order_drafts: [{ id: orderId, user_id: 'alice', status: 'active', updated_at: 'prior', order_state: { step: 4, accuzipValidation: { deliverableRecords: 100 }, designAndContent: { contactCard: { id: 'card' } } } }] }
    const { database } = mockDatabase(rows)
    const result = await saveDesignForUser(database, 'alice', { designState: doc, orderId })
    assert.equal(result.body.ok, true)
    if (!result.body.ok) throw new Error('Expected save')
    assert.equal(result.body.designId, designId)
    assert.equal(result.body.revision, await documentRevision(doc))
    const state = rows.order_drafts[0].order_state as Row
    assert.equal(state.step, 4)
    assert.deepEqual(state.accuzipValidation, { deliverableRecords: 100 })
    assert.deepEqual((state.designAndContent as Row).contactCard, { id: 'card' })
    assert.equal((state.design as Row).designId, designId)
  })
  it('uses created_by and metadata for editable draft orders without phantom columns', async () => {
    const { database, writes } = mockDatabase({ orders: [{ id: orderId, created_by: 'alice', status: 'draft', metadata: null }] })
    const result = await saveDesignForUser(database, 'alice', { designState: doc, orderId })
    assert.equal(result.body.ok, true)
    const link = writes.find(write => write.table === 'orders')!
    assert.deepEqual(Object.keys(link.values), ['metadata'])
  })
  it('reports linkage failure even when the design row persisted', async () => {
    const { database } = mockDatabase({ orders: [{ id: orderId, created_by: 'alice', status: 'draft', metadata: null }] }, true)
    const result = await saveDesignForUser(database, 'alice', { designState: doc, orderId })
    assert.equal(result.status, 409)
    assert.equal(result.body.ok, false)
  })
  it('does not update another user’s design', async () => {
    const rows = { saved_designs: [{ id: designId, user_id: 'bob', design_data: doc }] }
    const { database } = mockDatabase(rows)
    const result = await saveDesignForUser(database, 'alice', { designState: { ...doc, templateName: 'overwrite' }, designId }, true)
    assert.equal(result.status, 404)
    assert.deepEqual(rows.saved_designs[0].design_data, doc)
  })
  it('rejects invalid V2 documents and preserves extra page sides on valid saves', async () => {
    const { database } = mockDatabase({})
    assert.equal((await saveDesignForUser(database, 'alice', { designState: { ...doc, pages: { front: [] } } })).status, 400)
    const extra = { ...doc, pages: { ...doc.pages, 'page-three': [] } }
    const result = await saveDesignForUser(database, 'alice', { designState: extra })
    assert.equal(result.body.ok, true)
    if (result.body.ok) assert.equal(result.body.revision, await documentRevision(extra))
  })
})
