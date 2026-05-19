import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { isDuplicateAssetName } from '../../components/designer/is-duplicate-asset-name'

const assets = [
  { id: '1', name: 'Property Logo', url: 'u', sourceUrl: 's' },
  { id: '2', name: '  Hero Shot ', url: 'u', sourceUrl: 's' },
]

describe('isDuplicateAssetName', () => {
  it('matches case-insensitively and trims', () => {
    assert.equal(isDuplicateAssetName('property logo', assets), true)
    assert.equal(isDuplicateAssetName('  HERO shot', assets), true)
  })
  it('is false for a new name', () => {
    assert.equal(isDuplicateAssetName('New Banner', assets), false)
  })
  it('is false for an empty/blank name', () => {
    assert.equal(isDuplicateAssetName('', assets), false)
    assert.equal(isDuplicateAssetName('   ', assets), false)
  })
})
