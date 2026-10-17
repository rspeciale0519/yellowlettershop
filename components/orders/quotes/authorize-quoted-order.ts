import { approvalMatchesQuote, isPaymentForQuote, orderQuoteKey } from '../../../lib/orders/quote-state'
import type { OrderState, PaymentData, OrderWorkflowContextType } from '../../../types/orders'
export interface AuthorizationResult { status: string; clientSecret?: string }
export interface AuthorizeOptions {
  state: OrderState; payment: PaymentData; methodId: string; isCurrent(): boolean
  authorize(body: unknown): Promise<AuthorizationResult>
  submit: OrderWorkflowContextType['submitOrder']; update: OrderWorkflowContextType['updateOrderState']
  completeAction?(secret: string): Promise<boolean>
}
export async function authorizeQuotedOrder(options: AuthorizeOptions): Promise<{ success: boolean; orderId?: string }> {
  const { state, payment, methodId, isCurrent, authorize, submit, update, completeAction } = options
  if (!isCurrent() || !approvalMatchesQuote(state.approval, state.pricing) || !isPaymentForQuote(payment, state.pricing)) throw new Error('Review and approve the current final quote before paying.')
  const result = await authorize({ paymentIntentId: payment.paymentIntentId, paymentMethodId: methodId, orderState: state })
  let authorized = result.status === 'succeeded'
  if (result.status === 'requires_action' && result.clientSecret && completeAction) authorized = await completeAction(result.clientSecret)
  if (!isCurrent()) throw new Error('Your order changed during authorization. Review the current quote before submitting.')
  if (!authorized) throw new Error('Complete card authentication before submitting your order.')
  const authorizedPayment: PaymentData = { ...payment, status: 'authorized', paymentMethodId: methodId, authorizedAt: new Date() }
  update({ payment: authorizedPayment }, orderQuoteKey(state))
  const submitted = await submit({ payment: authorizedPayment })
  if (!submitted.success) throw new Error(submitted.error ?? 'Order submission failed')
  return submitted
}
