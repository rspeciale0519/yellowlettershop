import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { backoffDelayMs, shouldRetry, MAX_WEBHOOK_ATTEMPTS } from '../../../lib/webhooks/retry'

describe('backoffDelayMs', () => {
  it('grows exponentially from the base delay', () => {
    assert.equal(backoffDelayMs(1, 1000), 1000)
    assert.equal(backoffDelayMs(2, 1000), 2000)
    assert.equal(backoffDelayMs(3, 1000), 4000)
    assert.equal(backoffDelayMs(4, 1000), 8000)
  })
  it('caps at the ceiling', () => {
    assert.equal(backoffDelayMs(20, 1000, 30000), 30000)
  })
  it('treats attempts < 1 as the first attempt', () => {
    assert.equal(backoffDelayMs(0, 1000), 1000)
    assert.equal(backoffDelayMs(-5, 1000), 1000)
  })
})

describe('shouldRetry', () => {
  it('retries 5xx and 429 (transient)', () => {
    assert.equal(shouldRetry(500, 1), true)
    assert.equal(shouldRetry(503, 1), true)
    assert.equal(shouldRetry(429, 1), true)
  })
  it('does NOT retry other 4xx (client error — permanent)', () => {
    assert.equal(shouldRetry(400, 1), false)
    assert.equal(shouldRetry(404, 1), false)
    assert.equal(shouldRetry(401, 1), false)
  })
  it('does NOT retry success', () => {
    assert.equal(shouldRetry(200, 1), false)
    assert.equal(shouldRetry(204, 1), false)
  })
  it('stops once attempts reach the max even for transient codes', () => {
    assert.equal(shouldRetry(500, MAX_WEBHOOK_ATTEMPTS), false)
    assert.equal(shouldRetry(500, MAX_WEBHOOK_ATTEMPTS - 1), true)
  })
  it('treats a network error (status 0) as transient', () => {
    assert.equal(shouldRetry(0, 1), true)
  })
})
