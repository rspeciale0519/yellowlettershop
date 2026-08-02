// Pure refund arithmetic — no Stripe, no Supabase. The payment intent service
// applies these decisions; keeping them here makes the money math testable.

export interface RefundState {
  /** Cumulative dollars refunded once this refund lands. */
  totalRefunded: number
  /** True only when refunds have returned everything that was captured. */
  isFullRefund: boolean
}

/** Half a cent — below Stripe's resolution, above float drift. */
const CENT_EPSILON = 0.005

export interface RefundStateInput {
  /** orders.amount_refunded before this refund (dollars, cumulative). */
  previouslyRefunded: number | null | undefined
  /** orders.amount_captured (dollars). */
  amountCaptured: number | null | undefined
  /** Stripe's Refund.amount for THIS refund, in cents. */
  refundCents: number
}

/**
 * Stripe reports each refund's own amount, but `orders.amount_refunded` is
 * declared cumulative (20260801000000_orders_refund_columns.sql). Overwriting
 * it loses every earlier partial refund, and since admin revenue is computed as
 * captured minus refunded, the dashboard then over-reports by the amount that
 * was dropped.
 */
export function resolveRefundState(input: RefundStateInput): RefundState {
  const previous = Number(input.previouslyRefunded ?? 0)
  const captured = Number(input.amountCaptured ?? 0)

  const safePrevious = Number.isFinite(previous) && previous > 0 ? previous : 0
  const thisRefund = Number.isFinite(input.refundCents) ? input.refundCents / 100 : 0

  // Round to cents so repeated partials cannot accumulate binary-float dust.
  const totalRefunded = Math.round((safePrevious + thisRefund) * 100) / 100

  // Without a captured amount there is nothing to prove fullness against, so
  // stay partial: mislabelling a live order 'refunded' is worse than the
  // reverse, which the next refund corrects anyway.
  const isFullRefund =
    Number.isFinite(captured) && captured > 0 && totalRefunded >= captured - CENT_EPSILON

  return { totalRefunded, isFullRefund }
}
