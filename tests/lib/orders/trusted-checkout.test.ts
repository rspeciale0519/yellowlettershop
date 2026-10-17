import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing, DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { evaluateTrustedCheckout } from '../../../lib/orders/trusted-checkout'
import { evaluateOwnedFinishedJob } from '../../../lib/orders/validation-job'
import { parseMailingOptions } from '../../../lib/orders/mailing-options'
import { stripeCheckoutMetadata } from '../../../lib/payments/intent-metadata'

const owner = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const jobId = '33333333-3333-4333-8333-333333333333'

const mailingOptions = {
  serviceLevel: 'full_service',
  mailPieceFormat: 'postcard_4x6',
  postageType: 'first_class_forever',
  includePostage: true,
}

function state(count: number, extras: Record<string, unknown> = {}) {
  return {
    pricing: { totalPrice: 0.01 },
    accuzipValidation: { deliverableRecords: count, jobId, orderId: jobId },
    mailingOptions,
    ...extras,
  }
}

const finishedJob = {
  id: jobId,
  user_id: owner,
  status: 'completed',
  deliverable_count: 1000,
}

describe('trusted checkout record count', () => {
  it('uses the owned finished job count when the client count is honest', () => {
    const expected = calculatePricing(mailingOptions as never, 1000, DEFAULT_PRICING)
    const result = evaluateTrustedCheckout(finishedJob, owner, state(1000))
    assert.equal(result.ok, true)
    if (!result.ok) return
    assert.equal(result.recordCount, 1000)
    assert.equal(result.total, expected.total)
  })

  it('ignores a tampered client count on payment intent / submit', () => {
    const expected = calculatePricing(mailingOptions as never, 1000, DEFAULT_PRICING)
    const intent = evaluateTrustedCheckout(finishedJob, owner, state(1))
    const submit = evaluateTrustedCheckout(finishedJob, owner, state(1))
    assert.equal(intent.ok, true)
    assert.equal(submit.ok, true)
    if (!intent.ok || !submit.ok) return
    assert.equal(intent.recordCount, 1000)
    assert.equal(submit.recordCount, 1000)
    assert.equal(intent.total, expected.total)
    assert.equal(submit.total, expected.total)
    assert.notEqual(intent.total, calculatePricing(mailingOptions as never, 1, DEFAULT_PRICING).total)
  })

  it('rejects an unfinished job', () => {
    const result = evaluateTrustedCheckout(
      { ...finishedJob, status: 'processing' },
      owner,
      state(1000)
    )
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.status, 400)
      assert.match(result.error, /not finished/)
    }
  })

  it("rejects another user's job", () => {
    const result = evaluateTrustedCheckout(finishedJob, other, state(1000))
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.status, 403)
  })

  it('rejects a missing job', () => {
    const result = evaluateOwnedFinishedJob(null, owner)
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.status, 404)
  })
})

describe('unknown mailing options', () => {
  it('rejects a made-up paper stock instead of pricing it', () => {
    const parsed = parseMailingOptions({
      mailingOptions: { ...mailingOptions, paperStock: 'made_up_velvet' },
    })
    assert.equal(parsed.ok, false)
    if (!parsed.ok) assert.match(parsed.error, /paper stock/)

    const priced = evaluateTrustedCheckout(finishedJob, owner, {
      ...state(1000),
      mailingOptions: { ...mailingOptions, paperStock: 'made_up_velvet' },
    })
    assert.equal(priced.ok, false)
  })
})

describe('Stripe checkout metadata', () => {
  it('holds only user id and server-validated pricing inputs', () => {
    const result = evaluateTrustedCheckout(finishedJob, owner, state(1000))
    assert.equal(result.ok, true)
    if (!result.ok) return
    const meta = stripeCheckoutMetadata(owner, result.pricingInputs, 'ord-1')
    assert.deepEqual(Object.keys(meta).sort(), [
      'finish',
      'mail_piece_format',
      'order_id',
      'order_type',
      'paper_stock',
      'postage_included',
      'postage_type',
      'record_count',
      'server_total',
      'service_level',
      'user_id',
    ])
    assert.equal(meta.user_id, owner)
    assert.equal(meta.record_count, '1000')
    assert.equal(meta.order_id, 'ord-1')
    assert.equal('email' in meta, false)
  })
})
