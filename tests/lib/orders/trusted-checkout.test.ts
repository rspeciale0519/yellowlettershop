import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing, DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { checkoutPaymentError, evaluateTrustedCheckout } from '../../../lib/orders/trusted-checkout'
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
    design: { designJson: { formatId: 'postcard_4x6', pages: { front: [], back: [] } } },
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
  validated_records: Array.from({ length: 1000 }, (_, i) => ({ id: String(i), is_deliverable: true, standardized_address: { address_line_1: `${i + 1} Main`, city: 'Austin', state: 'TX', zip: '78701' } })),
}

describe('trusted checkout record count', () => {
  it('displays a positive quote below the Stripe minimum while refusing payment creation', () => {
    const job = { ...finishedJob, deliverable_count: 1, validated_records: finishedJob.validated_records.slice(0, 1) }
    const request = state(999, { mailingOptions: { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', includePostage: false } })
    const display = evaluateTrustedCheckout(job, owner, request, DEFAULT_PRICING, { requireDesign: false })
    assert.equal(display.ok, true)
    if (display.ok) assert.equal(display.total, 0.45)
    assert.equal(evaluateTrustedCheckout(job, owner, request).ok, false)
  })
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
      'quote_revision',
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

  it('rejects a PaymentIntent that already has an order_id or unexpected keys', () => {
    const result = evaluateTrustedCheckout(finishedJob, owner, state(1000))
    assert.equal(result.ok, true)
    if (!result.ok) return
    const payment = {
      amount: result.amountCents,
      currency: 'usd',
      capture_method: 'manual',
      metadata: stripeCheckoutMetadata(owner, result.pricingInputs),
    }
    assert.equal(checkoutPaymentError(payment, result, owner), null)
    assert.equal(checkoutPaymentError({ ...payment, metadata: { ...payment.metadata, order_id: 'already' } }, result, owner)?.status, 409)
    assert.equal(checkoutPaymentError({ ...payment, metadata: { ...payment.metadata, order_id: 'ord-1' } }, result, owner, { expectedOrderId: 'ord-1' }), null)
    assert.equal(checkoutPaymentError({ ...payment, metadata: { ...payment.metadata, extra: 'nope' } }, result, owner)?.status, 400)
  })
})
