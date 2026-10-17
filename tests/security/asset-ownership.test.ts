import { strict as assert } from 'assert'
import { assetRuntime as state, loadAssetRoute } from '../helpers/asset-route-harness'
import { storageAssetId } from '../../lib/assets/storage-fallback'

const route = loadAssetRoute()
const get = (assetId: string) => route.GET(new Request('http://localhost/assets/images/test'), { params: Promise.resolve({ assetId }) })
describe('asset image signed-URL ownership', () => {
  beforeEach(() => { state.user = 'owner'; state.asset = { user_id: 'owner', file_path: 'owner/image.png', file_type: 'image' }; state.signed = []; state.reads = 0 })
  it('rejects anonymous requests before any metadata read or URL signing', async () => {
    state.user = null
    for (const id of ['asset-id', storageAssetId('owner/image.png')]) assert.equal((await get(id)).status, 401)
    assert.equal(state.reads, 0); assert.deepEqual(state.signed, [])
  })
  it('rejects another user’s metadata-backed asset before signing', async () => {
    state.asset.user_id = 'other'
    assert.equal((await get('asset-id')).status, 404)
    assert.deepEqual(state.signed, [])
  })
  it('rejects forged owned metadata pointing at another user’s file', async () => {
    state.asset.file_path = 'other/image.png'
    assert.equal((await get('asset-id')).status, 404)
    assert.deepEqual(state.signed, [])
  })
  it('rejects encoded foreign paths, traversal, malformed IDs and non-images', async () => {
    for (const path of ['other/image.png', 'owner/../other/image.png', 'owner/%2e%2e/other/image.png', 'owner\\other.png', 'owner//image.png', 'owner/file.txt']) {
      assert.equal((await get(storageAssetId(path))).status, 404, path)
    }
    assert.equal((await get('storage--***')).status, 404)
    assert.deepEqual(state.signed, [])
  })
  it('signs authenticated owned metadata and storage-only images', async () => {
    assert.equal((await get('asset-id')).status, 302)
    assert.equal((await get(storageAssetId('owner/image.png'))).status, 302)
    assert.deepEqual(state.signed, ['owner/image.png', 'owner/image.png'])
  })
})
