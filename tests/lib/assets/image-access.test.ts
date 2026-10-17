import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { storageAssetId } from '../../../lib/assets/storage-fallback'
import {
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
})
