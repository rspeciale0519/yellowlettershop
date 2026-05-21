import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  mapRowToRecipientDTO,
  parseRecipientsQuery,
  type RecipientDTO,
} from '../../components/designer/preview/recipient-dto'

describe('mapRowToRecipientDTO', () => {
  it('maps a full snake_case mailing_list_records row to a clean DTO', () => {
    const dto = mapRowToRecipientDTO({
      id: 'rec-1',
      first_name: 'Jane',
      last_name: 'Doe',
      address_line1: '123 Main St',
      address_line2: 'Apt 4',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      company: 'Acme LLC',
      email: 'jane@example.com',
      phone: '512-555-0100',
    })
    const expected: RecipientDTO = {
      id: 'rec-1',
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      company: 'Acme LLC',
      email: 'jane@example.com',
      phone: '512-555-0100',
    }
    assert.deepEqual(dto, expected)
  })

  it('coerces nulls and missing keys to empty strings (never null/undefined)', () => {
    const dto = mapRowToRecipientDTO({ id: 'rec-2', first_name: null })
    assert.equal(dto.id, 'rec-2')
    assert.equal(dto.firstName, '')
    assert.equal(dto.lastName, '')
    assert.equal(dto.addressLine1, '')
    assert.equal(dto.zipCode, '')
    assert.ok(Object.values(dto).every((v) => typeof v === 'string'))
  })

  it('accepts the address_line_1 alias and stringifies a numeric zip', () => {
    const dto = mapRowToRecipientDTO({
      id: 7,
      address_line_1: '99 Elm',
      zip_code: 78701,
    })
    assert.equal(dto.id, '7')
    assert.equal(dto.addressLine1, '99 Elm')
    assert.equal(dto.zipCode, '78701')
  })
})

describe('parseRecipientsQuery', () => {
  it('parses kind=lists', () => {
    const q = parseRecipientsQuery(new URLSearchParams('kind=lists'))
    assert.deepEqual(q, { kind: 'lists' })
  })

  it('parses records with listId/search and clamps limit/offset', () => {
    const q = parseRecipientsQuery(
      new URLSearchParams('kind=records&listId=abc&search=jane&limit=999&offset=-3'),
    )
    assert.equal(q.kind, 'records')
    if (q.kind !== 'records') throw new Error('unreachable')
    assert.equal(q.listId, 'abc')
    assert.equal(q.search, 'jane')
    assert.equal(q.limit, 100) // clamped to max
    assert.equal(q.offset, 0) // floored at 0
  })

  it('defaults to records with limit 25 when kind is missing/invalid', () => {
    const q = parseRecipientsQuery(new URLSearchParams(''))
    assert.equal(q.kind, 'records')
    if (q.kind !== 'records') throw new Error('unreachable')
    assert.equal(q.limit, 25)
    assert.equal(q.offset, 0)
    assert.equal(q.listId, undefined)
  })
})
