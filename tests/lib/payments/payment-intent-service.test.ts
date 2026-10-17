import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'

process.env.STRIPE_SECRET_KEY ||= 'sk_test_csp_proof_not_a_secret'
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||= 'pk_test_csp_proof_not_a_secret'

describe('PaymentIntentService create path', () => {
  it('does not expose a client-amount createPaymentIntent', async () => {
    const { PaymentIntentService } = await import(
      '../../../lib/payments/payment-intent-service'
    )
    assert.equal(
      Object.prototype.hasOwnProperty.call(PaymentIntentService.prototype, 'createPaymentIntent'),
      false
    )
    assert.equal(typeof PaymentIntentService.prototype.capturePayment, 'function')
    assert.equal(typeof PaymentIntentService.prototype.refundPayment, 'function')

    const wrapper = readFileSync(
      join(__dirname, '../../../lib/payments/payment-service-new.ts'),
      'utf8'
    )
    assert.doesNotMatch(wrapper, /createPaymentIntent/)
    const types = readFileSync(join(__dirname, '../../../lib/payments/types.ts'), 'utf8')
    assert.doesNotMatch(types, /CreatePaymentIntentParams/)
  })
})
