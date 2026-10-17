import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { requireAccuzipApiKey } from '../../../../lib/api/accuzip/count-guard'

describe('estimateRecordCount fail-closed', () => {
  it('throws instead of inventing a Math.random count when no key is set', () => {
    assert.throws(() => requireAccuzipApiKey(undefined), /not configured/)
    assert.throws(() => requireAccuzipApiKey(''), /not configured/)
    assert.equal(requireAccuzipApiKey('present'), 'present')
  })
})
