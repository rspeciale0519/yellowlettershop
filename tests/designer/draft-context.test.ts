import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { draftKey, pendingDesignKey, readDraft, writeDraft, preserveDraftBeforeReplace, readPendingDesign, writePendingDesign, readOrderDraft, readOrderDesign } from '../../lib/designer/draft-context'
import { documentRevision } from '../../lib/designer/save-result'
import type { DesignerDocument } from '../../types/designer'

export const doc: DesignerDocument = { templateId: 't', templateName: 'Test', orientation: 'portrait', pages: { front: [], back: [] }, updatedAt: 'now' }
export const context = { userId: 'alice', templateId: 't', orderId: 'order-a' }
export function memoryStorage() {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, removeItem: (key: string) => { data.delete(key) } }
}
describe('scoped designer recovery', () => {
  it('isolates users, orders, templates, and designs in two tabs', () => {
    const storage = memoryStorage()
    writeDraft(storage, context, doc)
    const other = { ...context, orderId: 'order-b' }
    writeDraft(storage, other, { ...doc, templateName: 'Other order' })
    assert.equal(readDraft(storage, context)?.document.templateName, 'Test')
    assert.equal(readDraft(storage, other)?.document.templateName, 'Other order')
    for (const changed of [{ userId: 'bob' }, { templateId: 'other' }, { designId: 'saved' }]) assert.equal(readDraft(storage, { ...context, ...changed }), null)
    assert.notEqual(draftKey(context), draftKey(other))
    assert.notEqual(pendingDesignKey(context), pendingDesignKey(other))
  })
  it('recovers on reload and keeps the previous template before replacement', () => {
    const storage = memoryStorage()
    assert.equal(preserveDraftBeforeReplace(storage, context, doc), true)
    writeDraft(storage, { ...context, templateId: 'new' }, { ...doc, templateId: 'new' })
    assert.deepEqual(readDraft(storage, context)?.document.pages, doc.pages)
  })
  it('ignores old global, foreign-context, and malformed pending records', async () => {
    const storage = memoryStorage()
    storage.setItem('yls.pendingOrderDesign', JSON.stringify(doc))
    assert.equal(await readPendingDesign(storage, context), null)
    storage.setItem(pendingDesignKey(context), '{broken')
    assert.equal(await readPendingDesign(storage, context), null)
    const revision = await documentRevision(doc)
    await writePendingDesign(storage, context, { ok: true, designId: 'real', revision }, doc)
    assert.equal((await readPendingDesign(storage, context))?.designId, 'real')
    assert.equal(await readPendingDesign(storage, { ...context, userId: 'bob' }), null)
    assert.equal(await readPendingDesign(storage, context, 'stale'), null)
  })
  it('never hands off an old saved template while a replacement is only local', async () => {
    const storage = memoryStorage()
    writeDraft(storage, context, doc)
    await writePendingDesign(storage, context, { ok: true, designId: 'real', revision: await documentRevision(doc) }, doc)
    assert.equal((await readOrderDesign(storage, 'alice', 'order-a'))?.designId, 'real')
    const replacement = { ...doc, templateId: 'replacement' }
    writeDraft(storage, { ...context, templateId: 'replacement' }, replacement)
    assert.equal(await readOrderDesign(storage, 'alice', 'order-a'), null)
    assert.equal(readOrderDraft(storage, 'alice', 'order-a')?.document.templateId, 'replacement')
    assert.equal(readDraft(storage, context)?.document.templateId, 't')
  })
  it('reports blocked device storage without claiming a recovery exists', () => {
    const blocked = { getItem: () => { throw new Error('disabled') }, setItem: () => { throw new Error('disabled') }, removeItem: () => {} }
    assert.equal(writeDraft(blocked, context, doc), false)
    assert.equal(readDraft(blocked, context), null)
  })

})
