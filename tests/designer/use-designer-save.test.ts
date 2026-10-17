import { strict as assert } from 'assert'
import { after, afterEach, before, describe, it } from 'mocha'
import { JSDOM } from 'jsdom'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useDesignerSave } from '../../hooks/use-designer-save'
import { documentRevision } from '../../lib/designer/content-revision'
import { readDraft, readPendingDesign } from '../../lib/designer/draft-context'
import { doc, context, memoryStorage } from './draft-context.test'

describe('designer save hook behavior', () => {
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch }
  let dom: JSDOM
  before(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true })
  })
  afterEach(() => { cleanup(); globalThis.fetch = previous.fetch })
  after(() => { dom.window.close(); Object.assign(globalThis, previous) })
  it('exposes a local recovery after failure and only a real saved reference after Retry', async () => {
    const storage = memoryStorage()
    let fails = true
    globalThis.fetch = async () => new Response(JSON.stringify(fails ? { ok: false, message: 'Offline' } : { ok: true, designId: 'server-id', revision: await documentRevision(doc) }), { status: fails ? 503 : 200 })
    const { result } = renderHook(() => useDesignerSave({ document: doc, userId: 'alice', orderId: context.orderId, storage }))
    await act(async () => { const saved = await result.current.save(); assert.equal(saved.ok, false) })
    assert.equal(result.current.status, 'local')
    assert.equal(result.current.savedReference, null)
    fails = false
    await act(async () => { assert.equal((await result.current.retry()).ok, true) })
    assert.equal(result.current.status, 'saved')
    assert.equal(result.current.savedReference?.designId, 'server-id')
  })
  it('invalidates a saved reference immediately after an edit and preserves recovery before replacing', async () => {
    const storage = memoryStorage()
    globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, designId: 'server-id', revision: await documentRevision(doc) }))
    const { result, rerender } = renderHook(({ document }) => useDesignerSave({ document, userId: 'alice', orderId: context.orderId, storage }), { initialProps: { document: doc } })
    await act(async () => { await result.current.save() })
    assert.equal(result.current.preserveBeforeReplace(), true)
    const edited = { ...doc, templateName: 'Changed' }
    rerender({ document: edited })
    assert.equal(result.current.savedReference, null)
    assert.equal(readDraft(storage, context)?.document.templateName, 'Changed')
    assert.equal(await readPendingDesign(storage, context), null)
  })
  it('never reports a delayed older response as a current save', async () => {
    const storage = memoryStorage()
    let finish!: (response: Response) => void
    let signal!: () => void
    const started = new Promise<void>(resolve => { signal = resolve })
    globalThis.fetch = async () => { signal(); return new Promise(resolve => { finish = resolve }) }
    const { result, rerender } = renderHook(({ document }) => useDesignerSave({ document, userId: 'alice', orderId: context.orderId, storage }), { initialProps: { document: doc } })
    let saving!: ReturnType<typeof result.current.save>
    await act(async () => { saving = result.current.save(); await started })
    rerender({ document: { ...doc, templateName: 'Newer' } })
    await act(async () => { finish(new Response(JSON.stringify({ ok: true, designId: 'old', revision: await documentRevision(doc) }))); assert.equal((await saving).ok, false) })
    assert.equal(result.current.savedReference, null)
    assert.notEqual(result.current.status, 'saved')
    assert.equal(await readPendingDesign(storage, context), null)
  })
  it('does not overwrite recovery before initial hydration completes', () => {
    const storage = memoryStorage()
    renderHook(() => useDesignerSave({ document: doc, userId: 'alice', enabled: false, storage }))
    assert.equal(readDraft(storage, { userId: 'alice', templateId: 't' }), null)
  })
})
