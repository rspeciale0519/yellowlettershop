import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { missingRequiredMappings, isMappingComplete, REQUIRED_MAPPING_FIELDS } from '../../../lib/orders/column-mapping'

describe('missingRequiredMappings', () => {
  it('reports nothing when every required field is mapped', () => {
    const m = { address: 'col_a', city: 'col_b', state: 'col_c', zipCode: 'col_d' }
    assert.deepEqual(missingRequiredMappings(m), [])
    assert.equal(isMappingComplete(m), true)
  })

  it('lists each unmapped required field', () => {
    const missing = missingRequiredMappings({ address: 'col_a', city: '' })
    assert.deepEqual(missing.sort(), ['city', 'state', 'zipCode'].sort())
    assert.equal(isMappingComplete({ address: 'col_a', city: '' }), false)
  })

  it('treats whitespace-only and missing keys as unmapped', () => {
    assert.deepEqual(missingRequiredMappings({ address: '  ' }).sort(), REQUIRED_MAPPING_FIELDS.slice().sort())
  })

  it('ignores optional fields entirely', () => {
    const m = { address: 'a', city: 'c', state: 's', zipCode: 'z', firstName: '', email: '' }
    assert.deepEqual(missingRequiredMappings(m), [])
  })

  it('handles a null/undefined mapping object', () => {
    assert.deepEqual(missingRequiredMappings(null).sort(), REQUIRED_MAPPING_FIELDS.slice().sort())
    assert.equal(isMappingComplete(undefined), false)
  })
})
