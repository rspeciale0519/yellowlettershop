import { strict as assert } from 'assert'
import { describe, it } from 'mocha'
import { createDesignerDocument } from '../../components/designer/designer-templates'
import { resolveTemplateEntry, bootstrapTemplateDocument, templateEntryUrl, designerAuthenticationUrl } from '../../lib/designer/template-entry'

describe('template entry', () => {
  it('resolves the explicit ready letter catalog entry and its designer id', () => {
    const entry = resolveTemplateEntry('starter-yellow-letter')
    assert.deepEqual(entry, { catalogId: 'starter-yellow-letter', designerTemplateId: 'yellow-letter', formatId: 'letter_8_5x11', orientation: 'portrait', readiness: 'ready' })
    assert.deepEqual(resolveTemplateEntry('yellow-letter'), entry)
  })
  it('resolves the exact postcard geometry rather than another demo design', () => {
    assert.deepEqual(resolveTemplateEntry('starter-postcard-offer'), { catalogId: 'starter-postcard-offer', designerTemplateId: 'postcard-offer', formatId: 'postcard_6x9', orientation: 'portrait', readiness: 'ready' })
  })
  it('marks the unrelated mock listing as preview-only and rejects unknown ids', () => {
    assert.deepEqual(resolveTemplateEntry('re-001'), { catalogId: 're-001', designerTemplateId: null, formatId: null, orientation: null, readiness: 'preview-only' })
    assert.equal(resolveTemplateEntry('not-a-template'), null)
  })
  it('lets a requested template take precedence over a different recovered draft', () => {
    const draft = { ...createDesignerDocument(), designId: 'old-server-design' }
    const result = bootstrapTemplateDocument('yellow-letter', draft)
    assert.equal(result.status, 'ready')
    if (result.status !== 'ready') throw new Error('Expected ready document')
    assert.equal(result.document.templateId, 'yellow-letter')
    assert.equal(result.document.formatId, 'letter_8_5x11')
    assert.equal(result.document.designId, undefined)
    assert.equal(result.recovered, false)
  })
  it('recovers the matching draft without discarding custom orientation or content', () => {
    const draft = { ...createDesignerDocument('yellow-letter'), orientation: 'landscape' as const }
    const result = bootstrapTemplateDocument('starter-yellow-letter', draft)
    assert.equal(result.status, 'ready')
    if (result.status !== 'ready') throw new Error('Expected ready document')
    assert.equal(result.document, draft)
    assert.equal(result.recovered, true)
  })
  it('retains ordinary no-query draft recovery', () => {
    const draft = createDesignerDocument()
    const result = bootstrapTemplateDocument(null, draft)
    assert.equal(result.status, 'ready')
    if (result.status !== 'ready') throw new Error('Expected ready document')
    assert.equal(result.document, draft)
  })
  it('offers recovery instead of silently opening a different template for unavailable ids', () => {
    assert.deepEqual(bootstrapTemplateDocument('unknown', createDesignerDocument()), { status: 'unavailable', reason: 'unknown' })
    assert.deepEqual(bootstrapTemplateDocument('re-001', null), { status: 'unavailable', reason: 'preview-only' })
  })
  it('preserves existing order context while building an explicit template URL', () => {
    assert.equal(templateEntryUrl('starter-yellow-letter', '?orderId=order-123&source=order_wizard&auth=login'), '/design/customize?templateId=starter-yellow-letter&orderId=order-123&source=order_wizard')
  })
  it('keeps template selection and order context through the existing login destination', () => {
    const result = new URL(designerAuthenticationUrl('?templateId=yellow-letter&orderId=order-123&source=order_wizard'), 'https://example.test')
    assert.equal(result.searchParams.get('auth'), 'login')
    assert.equal(result.searchParams.get('redirectedFrom'), '/design/customize?templateId=yellow-letter&orderId=order-123&source=order_wizard')
  })

})
