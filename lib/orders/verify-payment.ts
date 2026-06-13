// Pure server-side verification that a payment intent legitimately backs an
// order before we persist it. The DB query (id + user_id) enforces ownership;
// this enforces authorized-status and amount-match so a client cannot submit
// an order against someone else's, an unauthorized, or an underpriced intent.

export interface StoredPaymentIntent {
  status: string
  amount: number
}

export interface PaymentVerification {
  ok: boolean
  reason?: string
}

// Stripe manual-capture authorizes to 'requires_capture'; we also accept our
// own 'authorized' alias used in some records.
const AUTHORIZED_STATUSES = new Set(['requires_capture', 'authorized'])
const AMOUNT_TOLERANCE = 0.01

/**
 * @param pi          the payment_intents row looked up by (id, user_id), or null
 * @param orderTotal  the server-side total for the order being submitted
 */
export function verifyAuthorizedPayment(
  pi: StoredPaymentIntent | null,
  orderTotal: number
): PaymentVerification {
  if (!pi) {
    return { ok: false, reason: 'No authorized payment found for this user/order' }
  }
  if (!AUTHORIZED_STATUSES.has(pi.status)) {
    return { ok: false, reason: `Payment is not authorized (status: ${pi.status})` }
  }
  if (!(orderTotal > 0)) {
    return { ok: false, reason: 'Order total is missing or non-positive' }
  }
  if (Math.abs(pi.amount - orderTotal) > AMOUNT_TOLERANCE) {
    return {
      ok: false,
      reason: `Authorized amount ${pi.amount} does not match order total ${orderTotal}`,
    }
  }
  return { ok: true }
}
