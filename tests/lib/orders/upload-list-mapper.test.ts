import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  mapRowToRecord,
  mapRowsToRecords,
  parseCsv,
  dbRecordToAccuzip,
} from '../../../lib/orders/upload-list-mapper'

const LIST_ID = 'list-123'

describe('mapRowToRecord', () => {
  it('maps recognized YLS fields to their real DB columns', () => {
    const row = {
      First: 'John',
      Last: 'Smith',
      Street: '123 Main St',
      Town: 'Austin',
      ST: 'TX',
      Zip: '78701',
    }
    const mappedFields = {
      first_name: 'First',
      last_name: 'Last',
      address_line_1: 'Street',
      city: 'Town',
      state: 'ST',
      zip_code: 'Zip',
    }
    const rec = mapRowToRecord(row, mappedFields, LIST_ID)
    assert.equal(rec.mailing_list_id, LIST_ID)
    assert.equal(rec.first_name, 'John')
    assert.equal(rec.last_name, 'Smith')
    assert.equal(rec.address_line1, '123 Main St')
    assert.equal(rec.city, 'Austin')
    assert.equal(rec.state, 'TX')
    assert.equal(rec.zip_code, '78701')
    assert.equal(rec.data_source, 'order_upload')
    assert.equal(rec.validation_status, 'pending')
    assert.deepEqual(rec.additional_data, {})
  })

  it('coerces numeric columns and drops non-numeric junk', () => {
    const row = { Beds: '3', Baths: '2.5', Value: '$450,000', Year: '1995.0', Junk: 'abc' }
    const mappedFields = {
      bedrooms: 'Beds',
      bathrooms: 'Baths',
      estimated_value: 'Value',
      year_built: 'Year',
      square_feet: 'Junk',
    }
    const rec = mapRowToRecord(row, mappedFields, LIST_ID)
    assert.equal(rec.bedrooms, 3)
    assert.equal(rec.bathrooms, 2.5)
    assert.equal(rec.estimated_value, 450000)
    assert.equal(rec.year_built, 1995)
    assert.equal(rec.square_feet, undefined) // 'abc' is not numeric
  })

  it('preserves unmapped source columns verbatim in additional_data', () => {
    const row = { First: 'Jane', Notes: 'VIP', Tag: 'hot-lead' }
    const mappedFields = { first_name: 'First' }
    const rec = mapRowToRecord(row, mappedFields, LIST_ID)
    assert.equal(rec.first_name, 'Jane')
    assert.deepEqual(rec.additional_data, { Notes: 'VIP', Tag: 'hot-lead' })
  })

  it('routes a mapped-but-unsupported YLS field (company) into additional_data', () => {
    const row = { First: 'Jane', Org: 'Acme Corp' }
    const mappedFields = { first_name: 'First', company: 'Org' }
    const rec = mapRowToRecord(row, mappedFields, LIST_ID)
    // company has no dedicated column → its source value is preserved as extras
    assert.deepEqual(rec.additional_data, { Org: 'Acme Corp' })
  })

  it('ignores null mappings and empty cells', () => {
    const row = { First: '  ', Last: 'Doe', Skip: 'x' }
    const mappedFields = { first_name: 'First', last_name: 'Last', email: null }
    const rec = mapRowToRecord(row, mappedFields, LIST_ID)
    assert.equal(rec.first_name, undefined) // whitespace-only -> dropped
    assert.equal(rec.last_name, 'Doe')
    assert.equal(rec.email, undefined)
    assert.deepEqual(rec.additional_data, { Skip: 'x' })
  })
})

describe('mapRowsToRecords', () => {
  it('maps every row and tags them with the list id', () => {
    const rows = [
      { First: 'A', Zip: '10001' },
      { First: 'B', Zip: '10002' },
    ]
    const recs = mapRowsToRecords(rows, { first_name: 'First', zip_code: 'Zip' }, LIST_ID)
    assert.equal(recs.length, 2)
    assert.ok(recs.every((r) => r.mailing_list_id === LIST_ID))
    assert.equal(recs[1].zip_code, '10002')
  })
})

describe('parseCsv', () => {
  it('parses a simple CSV into header-keyed objects', () => {
    const csv = 'first_name,last_name,zip\nJohn,Smith,78701\nJane,Doe,10001'
    const rows = parseCsv(csv)
    assert.equal(rows.length, 2)
    assert.deepEqual(rows[0], { first_name: 'John', last_name: 'Smith', zip: '78701' })
    assert.deepEqual(rows[1], { first_name: 'Jane', last_name: 'Doe', zip: '10001' })
  })

  it('handles quoted fields with commas and escaped quotes', () => {
    const csv = 'name,note\n"Smith, John","He said ""hi"""\n"Doe, Jane",plain'
    const rows = parseCsv(csv)
    assert.equal(rows.length, 2)
    assert.equal(rows[0].name, 'Smith, John')
    assert.equal(rows[0].note, 'He said "hi"')
    assert.equal(rows[1].name, 'Doe, Jane')
  })

  it('handles CRLF line endings and trailing newline', () => {
    const csv = 'a,b\r\n1,2\r\n3,4\r\n'
    const rows = parseCsv(csv)
    assert.equal(rows.length, 2)
    assert.deepEqual(rows[0], { a: '1', b: '2' })
    assert.deepEqual(rows[1], { a: '3', b: '4' })
  })

  it('skips fully blank lines', () => {
    const csv = 'a,b\n1,2\n\n3,4'
    const rows = parseCsv(csv)
    assert.equal(rows.length, 2)
  })

  it('returns an empty array for empty or header-only input', () => {
    assert.deepEqual(parseCsv(''), [])
    assert.deepEqual(parseCsv('a,b,c'), []) // header row only -> no data rows
  })
})

describe('dbRecordToAccuzip', () => {
  it('reads canonical DB columns directly', () => {
    const record = {
      id: 'rec-1',
      first_name: 'John',
      last_name: 'Smith',
      address_line1: '123 Main St',
      address_line2: 'Apt 4',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      email: 'j@example.com',
      phone: '555-1234',
      additional_data: {},
    }
    const az = dbRecordToAccuzip(record, '0')
    assert.equal(az.id, 'rec-1')
    assert.equal(az.address_line_1, '123 Main St')
    assert.equal(az.address_line_2, 'Apt 4')
    assert.equal(az.city, 'Austin')
    assert.equal(az.state, 'TX')
    assert.equal(az.zip, '78701')
    assert.equal(az.first_name, 'John')
    assert.equal(az.email, 'j@example.com')
  })

  it('falls back to additional_data and fallbackId when columns are empty', () => {
    const record = {
      address_line1: null,
      zip_code: '',
      additional_data: { address: '99 Back St', zip: '90210' },
    }
    const az = dbRecordToAccuzip(record, 'idx-7')
    assert.equal(az.id, 'idx-7')
    assert.equal(az.address_line_1, '99 Back St')
    assert.equal(az.zip, '90210')
  })
})
