import { strict as assert } from 'assert'
import { loadRoute, post, resetRuntime, runtime } from '../helpers/order-route-harness'
import { quoteDatabase } from '../helpers/quote-fixtures'
import { assetRuntime, loadAssetRoute } from '../helpers/asset-route-harness'
import { storageAssetId } from '../../lib/assets/storage-fallback'

const intent = loadRoute('../../app/api/payments/intent/route')
const authorize = loadRoute('../../app/api/payments/authorize/route')
const submit = loadRoute('../../app/api/orders/submit/route')
const image = loadAssetRoute()
async function quoted() {
  assert.equal((await post(intent, { orderState: runtime.state })).status, 200)
  runtime.intent.amount = runtime.created.amount as number
  runtime.intent.metadata = runtime.created.metadata as Record<string, string>
}
const authorization = () => ({ orderState: runtime.state, paymentIntentId: 'pi_test', paymentMethodId: 'pm_test' })
const submission = () => ({ orderState: { ...runtime.state, payment: { paymentIntentId: 'pi_test' } } })

describe('additional read-only checkout and asset negative review', () => {
  beforeEach(() => {
    resetRuntime()
    runtime.intent.currency = 'usd'; runtime.intent.capture_method = 'manual'
  })
  it('rejects another customer’s payment before any card action or order insert', async () => {
    await quoted(); runtime.intent.metadata.user_id = 'other'
    assert.equal((await post(authorize, authorization())).status, 403)
    assert.equal((await post(submit, submission())).status, 403)
    assert.equal(runtime.attached, 0); assert.equal(runtime.confirmed, 0)
    assert.deepEqual(runtime.inserted, {})
  })
  it('rejects wrong currency and automatic capture even when amount and owner match', async () => {
    await quoted()
    for (const [currency, capture] of [['eur', 'manual'], ['usd', 'automatic']]) {
      runtime.intent.currency = currency; runtime.intent.capture_method = capture
      assert.equal((await post(authorize, authorization())).status, 402)
      assert.equal((await post(submit, submission())).status, 402)
    }
    assert.equal(runtime.attached, 0); assert.equal(runtime.confirmed, 0)
    assert.deepEqual(runtime.inserted, {})
  })
  it('rejects artwork changed after quoting even if the amount is unchanged', async () => {
    await quoted()
    const state = { ...runtime.state, design: { ...runtime.state.design, designJson: { ...runtime.state.design.designJson, note: 'changed after payment' } } }
    assert.equal((await post(authorize, { ...authorization(), orderState: state })).status, 409)
    assert.equal((await post(submit, { orderState: { ...state, payment: { paymentIntentId: 'pi_test' } } })).status, 409)
    assert.equal(runtime.confirmed, 0); assert.deepEqual(runtime.inserted, {})
  })
  it('reloads server prices and rejects a stale cheaper authorization', async () => {
    await quoted()
    runtime.config = { ...runtime.config, printing: { ...runtime.config.printing, letter_8_5x11: runtime.config.printing.letter_8_5x11 + 10 } }
    assert.equal((await post(authorize, authorization())).status, 402)
    assert.equal((await post(submit, submission())).status, 402)
    assert.equal(runtime.confirmed, 0); assert.deepEqual(runtime.inserted, {})
  })
  it('rejects ambiguous validation references before Stripe creation', async () => {
    const state = { ...runtime.state, accuzipValidation: { jobId: 'other-job' } }
    assert.equal((await post(intent, { orderState: state })).status, 400)
    assert.deepEqual(runtime.created, {})
  })
  it('rejects malformed server recipient data rather than trusting a browser count', async () => {
    const fixture = quoteDatabase()
    fixture.rows.accuzip_validation_jobs.validated_records = [{ is_deliverable: true, standardized_address: { address_line_1: '', city: 'Austin', state: 'TX', zip: '78701' } }]
    runtime.db = fixture.db
    assert.equal((await post(intent, { orderState: runtime.state, amount: 1, recordCount: 1 })).status, 400)
    assert.deepEqual(runtime.created, {})
  })
  it('replaces both generations of browser recipient lists with the validated snapshot', async () => {
    await quoted()
    const state = { ...runtime.state, dataAndMapping: { listData: { selectedListId: 'foreign-list', manualRecords: [{ first_name: 'Unvalidated' }], totalRecords: 9999 } }, payment: { paymentIntentId: 'pi_test' } }
    assert.equal((await post(submit, { orderState: state })).status, 200)
    const saved = (runtime.inserted.metadata as { order_state: Record<string, any> }).order_state
    assert.equal(saved.listData.totalRecords, 1)
    assert.equal(saved.dataAndMapping.listData.totalRecords, 1)
    assert.equal(saved.dataAndMapping.listData.selectedListId, undefined)
    assert.equal(saved.dataAndMapping.listData.manualRecords[0].first_name, 'Actual')
  })
  it('accepts both historic owner namespaces and rejects a foreign namespace or owner prefix', async () => {
    assetRuntime.user = 'owner'; assetRuntime.signed = []
    for (const path of ['owner/image.png', 'assets/owner/image.png']) {
      assert.equal((await image.GET(new Request('http://localhost/test'), { params: Promise.resolve({ assetId: storageAssetId(path) }) })).status, 302)
    }
    const signedBefore = assetRuntime.signed.length
    for (const path of ['assets/other/image.png', 'owner-evil/image.png', 'assets/owner-evil/image.png']) {
      assert.equal((await image.GET(new Request('http://localhost/test'), { params: Promise.resolve({ assetId: storageAssetId(path) }) })).status, 404)
    }
    assert.equal(assetRuntime.signed.length, signedBefore)
  })
})
