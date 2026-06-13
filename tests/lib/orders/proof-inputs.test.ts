import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { resolveProofInputs } from '../../../lib/orders/proof-inputs'

const design = { designJson: { pages: { front: [], back: [] } }, isCustomDesign: true }

describe('resolveProofInputs', () => {
  it('throws a clear error when no design exists on the order', () => {
    assert.throws(() => resolveProofInputs({}), /design/i)
  })

  it('reads the design from the consolidated structure', () => {
    const inputs = resolveProofInputs({ designAndContent: { design } })
    assert.deepEqual(inputs.designState, design.designJson)
  })

  it('falls back to the legacy design slot', () => {
    const inputs = resolveProofInputs({ design })
    assert.deepEqual(inputs.designState, design.designJson)
  })

  it('uses the first manual record as the proof recipient', () => {
    const record = {
      first_name: 'Ada',
      last_name: 'Lovelace',
      address_line_1: '1 Analytical Way',
      city: 'London',
      state: 'NY',
      zip_code: '10001',
    }
    const inputs = resolveProofInputs({
      design,
      listData: { dataSource: 'manual_entry', manualRecords: [record], totalRecords: 1 },
    })
    assert.equal(inputs.recipient.firstName, 'Ada')
    assert.equal(inputs.recipient.lastName, 'Lovelace')
    assert.equal(inputs.recipient.addressLine1, '1 Analytical Way')
    assert.equal(inputs.recipient.zipCode, '10001')
  })

  it('returns an empty recipient when the list has no usable records', () => {
    const inputs = resolveProofInputs({ design })
    assert.equal(inputs.recipient.firstName, '')
    assert.equal(inputs.recipient.addressLine1, '')
  })

  it('maps the contact card to sender tokens', () => {
    const inputs = resolveProofInputs({
      design,
      contactCard: {
        contactCardData: {
          firstName: 'Yel',
          lastName: 'Low',
          company: 'YLS',
          phone: '555-0100',
          email: 'y@yls.test',
        },
      },
    })
    assert.equal(inputs.sender.firstName, 'Yel')
    assert.equal(inputs.sender.company, 'YLS')
    assert.equal(inputs.sender.phone, '555-0100')
  })

  it('honors an explicit designer formatId, defaulting otherwise', () => {
    const withFormat = resolveProofInputs({
      design: { ...design, designJson: { ...design.designJson, formatId: 'postcard_4x6' } },
    })
    assert.equal(withFormat.formatId, 'postcard_4x6')

    const without = resolveProofInputs({ design })
    assert.equal(without.formatId, 'letter_8_5x11')
  })
})
