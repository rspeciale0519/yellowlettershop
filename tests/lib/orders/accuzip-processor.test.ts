import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { buildValidationResults, type AccuzipRecord } from '../../../lib/orders/accuzip-processor'

const records: AccuzipRecord[] = [
  { id: '1', address_line_1: '1 Main St', address_line_2: '', city: 'Austin', state: 'TX', zip: '78701', first_name: 'A', last_name: 'One', email: '', phone: '' },
  { id: '2', address_line_1: '2 Elm St', address_line_2: '', city: 'Austin', state: 'TX', zip: '78702', first_name: 'B', last_name: 'Two', email: '', phone: '' },
  { id: '3', address_line_1: 'bogus', address_line_2: '', city: '', state: '', zip: '00000', first_name: 'C', last_name: 'Three', email: '', phone: '' },
]

describe('buildValidationResults', () => {
  it('marks deliverability from the validator verdicts and counts both sides', () => {
    const verdicts = new Map([
      ['1', { valid: true }],
      ['2', { valid: true }],
      ['3', { valid: false, errors: ['Invalid ZIP code'] }],
    ])
    const result = buildValidationResults(records, (r) => verdicts.get(r.id)!)

    assert.equal(result.deliverableCount, 2)
    assert.equal(result.undeliverableCount, 1)
    assert.equal(result.validatedRecords.length, 3)
    assert.equal(result.validatedRecords[0].is_deliverable, true)
    assert.equal(result.validatedRecords[2].is_deliverable, false)
    assert.deepEqual(result.validatedRecords[2].validation_errors, ['Invalid ZIP code'])
  })

  it('carries the original address through as the standardized address by default', () => {
    const result = buildValidationResults(records.slice(0, 1), () => ({ valid: true }))
    const std = result.validatedRecords[0].standardized_address
    assert.equal(std.address_line_1, '1 Main St')
    assert.equal(std.zip, '78701')
  })

  it('prefers a standardized address returned by the validator', () => {
    const result = buildValidationResults(records.slice(0, 1), () => ({
      valid: true,
      standardized: { line1: '1 MAIN ST', city: 'AUSTIN', state: 'TX', zip: '78701', plus4: '4321' },
    }))
    const std = result.validatedRecords[0].standardized_address
    assert.equal(std.address_line_1, '1 MAIN ST')
    assert.equal(std.zip_plus_4, '4321')
  })

  it('null validation_errors for clean records (UI contract)', () => {
    const result = buildValidationResults(records.slice(0, 1), () => ({ valid: true }))
    assert.equal(result.validatedRecords[0].validation_errors, null)
  })
})
