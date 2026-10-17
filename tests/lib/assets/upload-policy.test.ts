import { strict as assert } from 'assert'
import { allowPublicAssetUpload, escapePostgrestSearch } from '../../../lib/assets/upload-policy'

describe('upload and list input policy', () => {
  it('only permits public uploads for server-recognized admin roles', () => {
    assert.equal(allowPublicAssetUpload('user'), false)
    assert.equal(allowPublicAssetUpload(undefined), false)
    assert.equal(allowPublicAssetUpload('admin'), true)
    assert.equal(allowPublicAssetUpload('super_admin'), true)
  })

  it('strips PostgREST .or() metacharacters from search', () => {
    assert.equal(escapePostgrestSearch('hello,id.neq.0'), 'helloidneq0')
    assert.equal(escapePostgrestSearch('%secret_'), 'secret')
    assert.equal(escapePostgrestSearch('safe-name'), 'safe-name')
  })
})
