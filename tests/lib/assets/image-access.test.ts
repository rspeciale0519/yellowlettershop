import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { storageAssetId } from '../../../lib/assets/storage-fallback'
import {
  evaluateAssetAccess,
  extractAssetImageId,
  isOwnedStoragePath,
  ownedPathFromAssetId,
} from '../../../lib/assets/image-access'

describe('asset image access', () => {
  const owner = '11111111-1111-4111-8111-111111111111'
  const other = '22222222-2222-4222-8222-222222222222'

  it('allows only the owner folder of a storage-- id (IDOR)', () => {
    const mine = storageAssetId(`${owner}/photo.png`)
    const theirs = storageAssetId(`${other}/secret.png`)
    assert.equal(ownedPathFromAssetId(owner, mine), `${owner}/photo.png`)
    assert.equal(ownedPathFromAssetId(owner, theirs), null)
    assert.equal(isOwnedStoragePath(owner, `${other}/secret.png`), false)
    assert.equal(isOwnedStoragePath(owner, `${owner}/../${other}/x`), false)
  })

  it('extracts an asset id from the image proxy path', () => {
    assert.equal(
      extractAssetImageId('https://www.yellowlettershop.com/assets/images/abc%20123'),
      'abc 123'
    )
  })

  const privateAsset = {
    file_path: `${owner}/photo.png`,
    file_type: 'image',
    user_id: owner,
    is_public: false,
  }
  const publicAsset = { ...privateAsset, user_id: other, is_public: true }

  it('allows the owner of a private asset', () => {
    const decision = evaluateAssetAccess(owner, privateAsset)
    assert.equal(decision.ok, true)
    if (decision.ok) assert.equal(decision.filePath, privateAsset.file_path)
  })

  it('allows a public asset for another user or anon', () => {
    assert.equal(evaluateAssetAccess(owner, publicAsset).ok, true)
    assert.equal(evaluateAssetAccess(null, publicAsset).ok, true)
  })

  it('returns 403 when another user asks for a private asset', () => {
    const decision = evaluateAssetAccess(other, privateAsset)
    assert.equal(decision.ok, false)
    if (!decision.ok) assert.equal(decision.status, 403)
  })

  it('returns 401 when anon asks for a private asset', () => {
    const decision = evaluateAssetAccess(null, privateAsset)
    assert.equal(decision.ok, false)
    if (!decision.ok) assert.equal(decision.status, 401)
  })
})
