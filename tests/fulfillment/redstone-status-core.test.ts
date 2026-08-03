import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  mapRedstoneStatus,
  extractCallbackFields,
  redstoneAck,
  redstoneError,
} from '../../lib/fulfillment/redstone-status-core'

describe('mapRedstoneStatus', () => {
  it('maps Redstone spec §4.4 vocabulary', () => {
    assert.equal(mapRedstoneStatus('Preliminary Review'), 'accepted')
    assert.equal(mapRedstoneStatus('Production'), 'in_production')
    assert.equal(mapRedstoneStatus('Delivery / Mailed'), 'shipped')
  })

  it('treats "Completed Production" as in_production, NOT shipped', () => {
    // Printed is not mailed. `shipped` is what emails the customer that their
    // mail is on its way, and that promise cannot be taken back.
    assert.equal(mapRedstoneStatus('Completed Production'), 'in_production')
  })

  it('also accepts our own vocabulary, since Redstone offered to map to it', () => {
    assert.equal(mapRedstoneStatus('accepted'), 'accepted')
    assert.equal(mapRedstoneStatus('in_production'), 'in_production')
    assert.equal(mapRedstoneStatus('shipped'), 'shipped')
    assert.equal(mapRedstoneStatus('delivered'), 'delivered')
  })

  it('is tolerant of case and internal whitespace', () => {
    assert.equal(mapRedstoneStatus('  DELIVERY   /   MAILED '), 'shipped')
    assert.equal(mapRedstoneStatus('preliminary   review'), 'accepted')
  })

  it('returns null rather than guessing on anything unrecognised', () => {
    for (const v of ['', 'on hold', 'cancelled', null, undefined, 42, {}]) {
      assert.equal(mapRedstoneStatus(v as unknown), null, `should not map ${JSON.stringify(v)}`)
    }
  })
})

describe('extractCallbackFields', () => {
  it('reads the straightforward shape', () => {
    const f = extractCallbackFields({
      id: 'order-123',
      status: 'Delivery / Mailed',
      tracking: '9400100000000000000000',
    })
    assert.equal(f.externalOrderId, 'order-123')
    assert.equal(f.status, 'shipped')
    assert.equal(f.trackingNumber, '9400100000000000000000')
    assert.equal(f.trackingCarrier, 'USPS', 'defaults carrier when tracking is present')
  })

  it('accepts the field-name variants a vendor might plausibly send', () => {
    assert.equal(extractCallbackFields({ ext_id: 'a' }).externalOrderId, 'a')
    assert.equal(extractCallbackFields({ order_id: 'b' }).externalOrderId, 'b')
    assert.equal(extractCallbackFields({ orderId: 'c' }).externalOrderId, 'c')
    assert.equal(extractCallbackFields({ id: 7 }).externalOrderId, '7')
  })

  it('unwraps a single-key envelope', () => {
    // They wrap our outbound payload in Order on their end, so the inbound one
    // may well arrive wrapped too.
    const f = extractCallbackFields({ Order: { id: 'order-9', status: 'Production' } })
    assert.equal(f.externalOrderId, 'order-9')
    assert.equal(f.status, 'in_production')
  })

  it('produces a dedupe key that makes a replay identical but a real transition distinct', () => {
    const a = extractCallbackFields({ id: 'o1', status: 'Production' })
    const replay = extractCallbackFields({ id: 'o1', status: 'production' })
    const next = extractCallbackFields({ id: 'o1', status: 'Delivery / Mailed' })
    assert.equal(a.dedupeKey, replay.dedupeKey, 'same event must collide')
    assert.notEqual(a.dedupeKey, next.dedupeKey, 'a later transition must not collide')
  })

  it('has no dedupe key when the payload identifies nothing', () => {
    assert.equal(extractCallbackFields({}).dedupeKey, null)
    assert.equal(extractCallbackFields({ status: 'Production' }).dedupeKey, null)
  })

  it('survives junk without throwing', () => {
    for (const v of [null, undefined, 'string', 42, []]) {
      const f = extractCallbackFields(v as unknown)
      assert.equal(f.externalOrderId, null)
      assert.equal(f.status, null)
    }
  })

  it('leaves carrier null when there is no tracking to attribute', () => {
    assert.equal(extractCallbackFields({ id: 'o1', status: 'Production' }).trackingCarrier, null)
  })
})

describe('redstone response envelope', () => {
  it('answers in Redstone spec §5 vocabulary', () => {
    assert.deepEqual(redstoneAck(), { fail: false, msg: 'ok' })
  })

  it('sends fail:true on error despite the spec example printing false', () => {
    // Their doc prints the error case as "fail":false, which is plainly a typo.
    assert.deepEqual(redstoneError('nope'), { fail: true, msg: 'nope' })
  })
})
