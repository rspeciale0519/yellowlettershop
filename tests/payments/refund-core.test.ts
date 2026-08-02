import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { resolveRefundState } from '../../lib/payments/refund-core'

describe('resolveRefundState', () => {
  it('accumulates instead of overwriting', () => {
    // $40 refunded, then $30. The column is cumulative, so the second refund
    // must land on $70 — writing $30 would tell the dashboard we kept $70 of a
    // $100 order when we kept $30.
    const first = resolveRefundState({
      previouslyRefunded: null,
      amountCaptured: 100,
      refundCents: 4000,
    })
    assert.equal(first.totalRefunded, 40)
    assert.equal(first.isFullRefund, false)

    const second = resolveRefundState({
      previouslyRefunded: first.totalRefunded,
      amountCaptured: 100,
      refundCents: 3000,
    })
    assert.equal(second.totalRefunded, 70)
    assert.equal(second.isFullRefund, false)
  })

  it('only calls it full when everything captured is back', () => {
    const partial = resolveRefundState({
      previouslyRefunded: 0,
      amountCaptured: 100,
      refundCents: 100,
    })
    assert.equal(partial.isFullRefund, false, '$1 of $100 is not a refunded order')

    const exact = resolveRefundState({
      previouslyRefunded: 70,
      amountCaptured: 100,
      refundCents: 3000,
    })
    assert.equal(exact.totalRefunded, 100)
    assert.equal(exact.isFullRefund, true)
  })

  it('treats an over-refund as full rather than going backwards', () => {
    const out = resolveRefundState({
      previouslyRefunded: 100,
      amountCaptured: 100,
      refundCents: 500,
    })
    assert.equal(out.totalRefunded, 105)
    assert.equal(out.isFullRefund, true)
  })

  it('survives repeated partials without float dust', () => {
    let running = 0
    for (let i = 0; i < 3; i++) {
      running = resolveRefundState({
        previouslyRefunded: running,
        amountCaptured: 100,
        refundCents: 1010, // $10.10
      }).totalRefunded
    }
    assert.equal(running, 30.3)
  })

  it('stays partial when the captured amount is unknown', () => {
    // Better to under-claim than to mark a live order refunded on missing data.
    for (const captured of [null, undefined, 0]) {
      const out = resolveRefundState({
        previouslyRefunded: 0,
        amountCaptured: captured,
        refundCents: 5000,
      })
      assert.equal(out.totalRefunded, 50)
      assert.equal(out.isFullRefund, false, `captured=${captured} should not read as full`)
    }
  })

  it('tolerates a null previous balance and a cent of rounding slack', () => {
    assert.equal(
      resolveRefundState({ previouslyRefunded: null, amountCaptured: 10, refundCents: 1000 })
        .isFullRefund,
      true
    )
    // 9.999 vs 10.00 — within half a cent, so the order is fully refunded.
    assert.equal(
      resolveRefundState({ previouslyRefunded: 9.999, amountCaptured: 10, refundCents: 0 })
        .isFullRefund,
      true
    )
  })
})
