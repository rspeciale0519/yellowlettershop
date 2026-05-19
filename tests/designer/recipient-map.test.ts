import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { buildTokenContext } from '../../components/designer/tokens/recipient-map'

describe('buildTokenContext', () => {
  const ctx = buildTokenContext(
    {
      id: 'r1',
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 2',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      company: 'Acme',
      email: 'j@x.com',
      phone: '555',
    },
    { firstName: 'Bob', lastName: 'Agent', phone: '999', company: 'YLS', email: 'bob@yls.com' },
  )

  it('exposes recipient values under canonical keys', () => {
    assert.equal(ctx.values.first_name, 'Jane')
    assert.equal(ctx.values.last_name, 'Doe')
    assert.equal(ctx.values.address_line_1, '123 Main St')
    assert.equal(ctx.values.city, 'Austin')
    assert.equal(ctx.values.state, 'TX')
    assert.equal(ctx.values.zip_code, '78701')
    assert.equal(ctx.values.full_name, 'Jane Doe')
  })

  it('exposes sender values', () => {
    assert.equal(ctx.values.sender_first, 'Bob')
    assert.equal(ctx.values.sender_last, 'Agent')
    assert.equal(ctx.values.sender_phone, '999')
    assert.equal(ctx.values.sender_company, 'YLS')
  })

  it('mailing_address mirrors address_line_1 (alias parity)', () => {
    assert.equal(ctx.values.address_line_1, ctx.values.mailing_address)
  })
})
