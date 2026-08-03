import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  assertPublicFileUrl,
  buildOrderPayload,
  buildRawResponse,
  buildRedstoneCsv,
  classifyRedstoneResponse,
  deriveDueDate,
  mapDistType,
  mapJobType,
  mapPostage,
  sanitizeRedstoneCell,
  MAX_RAW_BODY_CHARS,
} from '../../lib/fulfillment/redstone-core'

describe('classifyRedstoneResponse', () => {
  // These three shapes were observed against the live API on 2026-08-01.
  it('treats a bad/missing key as permanent, not retryable', () => {
    const out = classifyRedstoneResponse(200, '{"fail":true,"msg":"Where did you come from?"}')
    assert.equal(out.kind, 'permanent')
    assert.match(out.message, /API key/i)
  })

  it('does NOT treat HTTP 200 as success on its own', () => {
    const out = classifyRedstoneResponse(200, '{"fail":true,"msg":"Missing POST Data"}')
    assert.equal(out.kind, 'permanent')
    assert.equal(out.message, 'Missing POST Data')
  })

  it('accepts the documented success body', () => {
    assert.equal(classifyRedstoneResponse(200, '{"fail":false,"msg":"ok"}').kind, 'accepted')
  })

  it('treats the HTML 500 error page as permanent — retrying re-sends the same bad payload', () => {
    const out = classifyRedstoneResponse(500, '<!DOCTYPE html><html>An Internal Error Has Occurred.')
    assert.equal(out.kind, 'permanent')
    assert.match(out.message, /human must review/i)
  })

  it('treats a duplicate order id as already-accepted', () => {
    assert.equal(classifyRedstoneResponse(409, '').kind, 'duplicate')
    assert.equal(
      classifyRedstoneResponse(200, '{"fail":true,"msg":"An order already exists with id X"}').kind,
      'duplicate'
    )
  })

  it('retries only throttling, maintenance, and network failures', () => {
    assert.equal(classifyRedstoneResponse(429, '').kind, 'retryable')
    assert.equal(classifyRedstoneResponse(503, '').kind, 'retryable')
    assert.equal(classifyRedstoneResponse(0, '').kind, 'retryable')
  })

  it('does not retry a validation rejection', () => {
    assert.equal(classifyRedstoneResponse(422, '{"fail":true,"msg":"duedate is in the past"}').kind, 'permanent')
  })
})

describe('assertPublicFileUrl', () => {
  it('accepts a public https URL with a signed-token query', () => {
    assert.doesNotThrow(() =>
      assertPublicFileUrl('https://abc.supabase.co/storage/v1/object/sign/x.csv?token=eyJ', 'Data')
    )
  })

  it('rejects local and private hosts Redstone cannot reach', () => {
    for (const url of [
      'http://localhost:3010/f.csv',
      'http://127.0.0.1:62440/f.csv',
      'http://192.168.1.10/f.csv',
      'http://10.0.0.4/f.csv',
      'http://172.16.5.9/f.csv',
    ]) {
      assert.throws(() => assertPublicFileUrl(url, 'Data'), /cannot reach/i, `expected reject: ${url}`)
    }
  })

  it('rejects embedded credentials and non-http schemes', () => {
    assert.throws(() => assertPublicFileUrl('https://u:p@host.com/f.csv', 'Data'), /credentials/i)
    assert.throws(() => assertPublicFileUrl('ftp://host.com/f.csv', 'Data'), /http/i)
  })

  it("rejects URLs past Redstone's 2048-character limit", () => {
    const long = 'https://host.com/f.csv?token=' + 'a'.repeat(2100)
    assert.throws(() => assertPublicFileUrl(long, 'Data'), /2048/)
  })
})

describe('buildRedstoneCsv', () => {
  it('emits headers Redstone actually recognizes', () => {
    const header = buildRedstoneCsv([]).split('\n')[0]
    // Our own vendor CSV uses Address_1/Zip_Code, which are NOT synonyms there.
    assert.equal(header, 'First,Last,address,address2,City,State,zip,Company,Email,Phone')
  })

  it('strips commas and quotes rather than quoting them', () => {
    const csv = buildRedstoneCsv([
      { first_name: 'Ann', last_name: 'Lee', address_line_1: 'Apt 5, "B" Bldg', city: 'Reno', state: 'NV', zip_code: '89501' },
    ])
    const row = csv.split('\n')[1]
    assert.equal(row.split(',').length, 10, 'a stray comma would shift every later column')
    assert.match(row, /Apt 5 B Bldg/)
  })

  it('folds non-ASCII down instead of emitting it', () => {
    assert.equal(sanitizeRedstoneCell('Renée Muñoz'), 'Renee Munoz')
    assert.equal(sanitizeRedstoneCell('a—b'), 'a b')
    assert.equal(sanitizeRedstoneCell(null), '')
  })

  // The apostrophe strip above runs before the guard, so this only holds if
  // the guard is applied last (CWE-1236).
  it('defuses spreadsheet formulas after stripping', () => {
    assert.equal(sanitizeRedstoneCell('=SUM(A1)'), "'=SUM(A1)")
    assert.equal(sanitizeRedstoneCell('@import'), "'@import")
    assert.equal(sanitizeRedstoneCell('=cmd|\'/C calc\'!A0'), "'=cmd| /C calc !A0")
    // Ordinary values keep their exact shape.
    assert.equal(sanitizeRedstoneCell('Ann'), 'Ann')
    assert.equal(sanitizeRedstoneCell('33601'), '33601')
  })

  it('keeps the column count stable when a formula is defused', () => {
    const csv = buildRedstoneCsv([{ first_name: '=HYPERLINK("http://evil.test")' }])
    assert.equal(csv.split('\n')[1].split(',').length, 10)
  })
})

describe('deriveDueDate', () => {
  const from = new Date('2026-08-01T12:00:00Z')

  it('is always in the future — Redstone rejects past due dates', () => {
    for (const level of ['full_service', 'ship_processed', 'print_only', undefined]) {
      assert.ok(deriveDueDate(from, level) > '2026-08-01', `level ${level} produced a past date`)
    }
  })

  it('uses the service level lead time', () => {
    assert.equal(deriveDueDate(from, 'full_service'), '2026-08-08')
    assert.equal(deriveDueDate(from, 'ship_processed'), '2026-08-06')
    assert.equal(deriveDueDate(from, 'print_only'), '2026-08-04')
  })

  it('rolls the month over correctly', () => {
    assert.equal(deriveDueDate(new Date('2026-08-28T00:00:00Z'), 'full_service'), '2026-09-04')
  })
})

describe('field mapping', () => {
  it('maps postcard formats to Post Card with dimensions', () => {
    assert.deepEqual(mapJobType('postcard_4x6'), {
      jobtype: 'Post Card',
      postcardH: '4',
      postcardW: '6',
    })
    assert.equal(mapJobType('letter_8_5x11').jobtype, 'Letter')
  })

  it('splits our postage option into Redstone class + type', () => {
    assert.deepEqual(mapPostage('first_class_forever'), {
      postage_class: 'First Class',
      postage_type: 'Stamp',
    })
    assert.deepEqual(mapPostage('standard'), {
      postage_class: 'Standard',
      postage_type: 'Permit',
    })
  })

  it('maps non-mailing service levels to Will Call', () => {
    assert.equal(mapDistType('full_service'), 'None')
    assert.equal(mapDistType('print_only'), 'Will Call')
  })
})

describe('buildOrderPayload', () => {
  const base = {
    orderId: 'a1b2c3d4-0000-0000-0000-000000000000',
    campaignName: 'Spring Farm',
    recordCount: 500,
    dataUrl: 'https://abc.supabase.co/x.csv?token=t',
    artUrl: 'https://abc.supabase.co/x.pdf?token=t',
    mailPieceFormat: 'postcard_4x6',
    postageType: 'first_class_forever',
    serviceLevel: 'full_service',
    dueDate: '2026-08-08',
    apiTest: true,
  }

  it('carries every field Redstone requires', () => {
    const p = buildOrderPayload(base)
    for (const key of ['id', 'name', 'duedate', 'jobtype', 'qty_est', 'notes', 'api_type', 'data']) {
      assert.ok(p[key] !== undefined, `missing required field: ${key}`)
    }
    assert.equal(p.id, base.orderId, 'our order id is the idempotency key')
    assert.equal(p.qty_est, '500', 'qty_est must be a string')
    assert.equal(p.api_type, 'json')
  })

  it('propagates test mode so a live order is never sent by accident', () => {
    assert.equal(buildOrderPayload(base).api_test, true)
    assert.equal(buildOrderPayload({ ...base, apiTest: false }).api_test, false)
  })

  it('omits art entirely when there is no proof', () => {
    assert.ok(!('art' in buildOrderPayload({ ...base, artUrl: null })))
  })

  it('refuses to build a payload pointing at unreachable storage', () => {
    assert.throws(
      () => buildOrderPayload({ ...base, dataUrl: 'http://127.0.0.1:62440/x.csv' }),
      /cannot reach/i
    )
  })

  it('truncates over-long names and notes to the documented limits', () => {
    const p = buildOrderPayload({ ...base, campaignName: 'x'.repeat(400), notes: 'y'.repeat(900) })
    assert.equal(String(p.name).length, 255)
    assert.equal(String(p.notes).length, 500)
  })
})

describe('buildRawResponse', () => {
  const base = {
    status: 500,
    headers: { 'Content-Type': 'text/html', 'X-Trace': 'abc' },
    body: '<html>Server Error</html>',
    apiKey: 'SECRET-KEY-VALUE',
    at: '2026-08-03T00:00:00.000Z',
  }

  it('keeps the response verbatim', () => {
    const r = buildRawResponse(base)
    assert.equal(r.status, 500)
    assert.equal(r.body, '<html>Server Error</html>')
    assert.equal(r.truncated, false)
    assert.equal(r.at, '2026-08-03T00:00:00.000Z')
  })

  it('lowercases header names so lookups are predictable', () => {
    const r = buildRawResponse(base)
    assert.equal(r.headers['content-type'], 'text/html')
    assert.equal(r.headers['x-trace'], 'abc')
  })

  it('redacts the API key from the body', () => {
    // The key travels in the query string, so an echoed URL would leak it into
    // anything we persist or paste into a vendor email.
    const r = buildRawResponse({
      ...base,
      body: 'error calling /createOrder?API=SECRET-KEY-VALUE at line 3',
    })
    assert.ok(!r.body.includes('SECRET-KEY-VALUE'), 'key must not survive')
    assert.ok(r.body.includes('***'))
  })

  it('redacts the API key from headers too', () => {
    const r = buildRawResponse({
      ...base,
      headers: { Location: 'https://x.test/retry?API=SECRET-KEY-VALUE' },
    })
    assert.ok(!r.headers['location'].includes('SECRET-KEY-VALUE'))
  })

  it('bounds an unbounded HTML error page', () => {
    const r = buildRawResponse({ ...base, body: 'x'.repeat(MAX_RAW_BODY_CHARS + 500) })
    assert.equal(r.truncated, true)
    assert.equal(r.body.length, MAX_RAW_BODY_CHARS)
  })

  it('does not mark an exactly-at-limit body as truncated', () => {
    const r = buildRawResponse({ ...base, body: 'x'.repeat(MAX_RAW_BODY_CHARS) })
    assert.equal(r.truncated, false)
  })

  it('tolerates an empty api key without mangling the body', () => {
    const r = buildRawResponse({ ...base, apiKey: '' })
    assert.equal(r.body, base.body)
  })
})
