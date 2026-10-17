import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { createDesignerSaveController, documentRevision } from '../../lib/designer/save-result'
import { doc, context, memoryStorage } from './draft-context.test'
import { readPendingDesign } from '../../lib/designer/draft-context'

describe('dependable designer save results', () => {
  it('does not certify a save after its editor context stops being active', async () => {
    const storage=memoryStorage()
    let active=true
    let start!:()=>void, release!:()=>void
    const ready=new Promise<void>(resolve=>{start=resolve})
    const controller=createDesignerSaveController({getCurrent:()=>({document:doc,context,active}),storage,persist:async(_snapshot,_id,revision)=>{
      start();await new Promise<void>(resolve=>{release=resolve})
      return {ok:true,designId:'old-context',revision}
    }})
    const saving=controller.save()
    await ready
    active=false
    release()
    assert.equal((await saving).ok,false)
    assert.equal(await readPendingDesign(storage,context),null)
  })
  it('uses canonical content revisions across key order and server metadata', async () => {
    const first = await documentRevision(doc)
    assert.match(first, /^sha256:[a-f0-9]{64}$/)
    assert.equal(await documentRevision({ ...doc, designId: 'server', updatedAt: 'later' }), first)
    assert.notEqual(await documentRevision({ ...doc, templateName: 'Edited' }), first)
  })
  it('returns local recovery on remote failure, then retries successfully', async () => {
    const storage = memoryStorage()
    let fails = true
    const controller = createDesignerSaveController({ getCurrent: () => ({ document: doc, context }), storage, persist: async (_snapshot, _id, revision) => fails ? { ok: false, recoverySaved: false, message: 'Offline' } : { ok: true, designId: 'saved', revision } })
    assert.deepEqual(await controller.save(), { ok: false, recoverySaved: true, message: 'Offline' })
    assert.equal(await readPendingDesign(storage, context), null)
    fails = false
    assert.equal((await controller.save()).ok, true)
    assert.equal((await readPendingDesign(storage, context))?.designId, 'saved')
  })
  it('does not hand off an older snapshot after a newer edit', async () => {
    const storage = memoryStorage()
    let document = doc
    let resolve!: (result: { ok: true; designId: string; revision: string }) => void
    let started!: () => void
    const ready = new Promise<void>(r => { started = r })
    const controller = createDesignerSaveController({ getCurrent: () => ({ document, context }), storage, persist: async () => { started(); return new Promise(r => { resolve = r }) } })
    const saving = controller.save()
    await ready
    document = { ...doc, templateName: 'Newer edit' }
    resolve({ ok: true, designId: 'old', revision: await documentRevision(doc) })
    assert.equal((await saving).ok, false)
    assert.equal(await readPendingDesign(storage, context), null)
  })
  it('rejects a server revision that does not match the requested snapshot', async () => {
    const storage = memoryStorage()
    const controller = createDesignerSaveController({ getCurrent: () => ({ document: doc, context }), storage, persist: async () => ({ ok: true, designId: 'id', revision: 'wrong' }) })
    assert.equal((await controller.save()).ok, false)
    assert.equal(await readPendingDesign(storage, context), null)
  })
  it('serializes remote writes and reuses a real id after an obsolete response', async () => {
    const storage = memoryStorage()
    let document = doc
    let release!: () => void
    let signal!: () => void
    const started = new Promise<void>(resolve => { signal = resolve })
    const ids: (string | undefined)[] = []
    const controller = createDesignerSaveController({ getCurrent: () => ({ document, context }), storage, persist: async (_snapshot, id, revision) => {
      ids.push(id)
      if (ids.length === 1) { signal(); await new Promise<void>(resolve => { release = resolve }) }
      return { ok: true, designId: 'real', revision }
    } })
    const first = controller.save()
    await started
    document = { ...doc, templateName: 'Latest' }
    const second = controller.save()
    assert.equal(ids.length, 1)
    release()
    assert.equal((await first).ok, false)
    assert.equal((await second).ok, true)
    assert.deepEqual(ids, [undefined, 'real'])
    assert.equal((await readPendingDesign(storage, context))?.document.templateName, 'Latest')
  })
  it('makes the revision sensitive to per-textbox guided content and extra sides', async () => {
    const textbox = { id: 'text', name: 'Text', type: 'text', x: 0, y: 0, width: 100, height: 100, zIndex: 0, content: 'Hi', fontSize: 12, writingMode: 'guided', richText: { id: 'text', style: { fontSize: 12 }, paragraphs: [{ runs: [{ text: 'Hi', style: { bold: true } }] }] } }
    const guided = { ...doc, pages: { ...doc.pages, front: [textbox], 'page-extra': [] } }
    const first = await documentRevision(guided)
    assert.notEqual(first, await documentRevision(doc))
    assert.notEqual(first, await documentRevision({ ...guided, pages: { ...guided.pages, front: [{ ...textbox, writingMode: 'free' }] } }))
    const reversed = Object.fromEntries(Object.entries(guided).reverse())
    assert.equal(first, await documentRevision(reversed))
  })

})
