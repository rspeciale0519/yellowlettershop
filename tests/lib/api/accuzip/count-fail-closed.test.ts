import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { requireAccuzipApiKey } from '../../../../lib/api/accuzip/count-guard'

describe('estimateRecordCount fail-closed', () => {
  it('throws instead of inventing a Math.random count when no key is set', () => {
    const previous = process.env.ACCUZIP_API_KEY
    delete process.env.ACCUZIP_API_KEY
    try {
      assert.throws(() => requireAccuzipApiKey(undefined), /not configured/)
      assert.throws(() => requireAccuzipApiKey(''), /not configured/)
      assert.equal(requireAccuzipApiKey('present'), 'present')
    } finally {
      if (previous === undefined) delete process.env.ACCUZIP_API_KEY
      else process.env.ACCUZIP_API_KEY = previous
    }
  })
})
