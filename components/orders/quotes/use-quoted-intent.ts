'use client'
import { useEffect, useRef, useState } from 'react'
import type { OrderState, PricingBreakdown, PaymentData, OrderWorkflowContextType } from '../../../types/orders'
import { orderQuoteKey, isFinalOrderQuote, approvalMatchesQuote } from '../../../lib/orders/quote-state'
import { requestJson } from './request-json'

type IntentResponse = { paymentIntentId: string; clientSecret: string; quoteRevision: string; amount: number; pricing: PricingBreakdown }
export function useQuotedIntent(state: OrderState, pricing: PricingBreakdown | undefined, update: OrderWorkflowContextType['updateOrderState'], accept: (pricing: PricingBreakdown, key: string) => void) {
  const key = orderQuoteKey(state)
  const revision = pricing?.quoteRevision
  const enabled = isFinalOrderQuote(pricing) && approvalMatchesQuote(state.approval, pricing) && state.proofQuoteRevision === pricing.quoteRevision && !state.proofPending
  const latest = useRef({ state, key, revision, update, accept })
  latest.current = { state, key, revision, update, accept }
  const [result, setResult] = useState<{ key: string; revision?: string; payment?: PaymentData; error: string | null; isLoading: boolean }>({ key: '', error: null, isLoading: false })
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const current = () => !controller.signal.aborted && latest.current.key === key && latest.current.revision === revision
    setResult({ key, revision, error: null, isLoading: true })
    void requestJson<IntentResponse>('/api/payments/intent', { orderState: latest.current.state }, controller.signal).then(response => {
      if (!current()) return
      if (!isFinalOrderQuote(response.pricing) || response.quoteRevision !== response.pricing.quoteRevision || response.amount !== response.pricing.totalPrice) throw new Error('Payment setup did not return a matching final quote.')
      latest.current.accept(response.pricing, key)
      if (response.quoteRevision !== revision) throw new Error('The server quote changed. Review and approve the updated order before paying.')
      const payment: PaymentData = { paymentIntentId: response.paymentIntentId, status: 'pending', amount: response.amount, currency: 'usd', quoteRevision: response.quoteRevision }
      latest.current.update({ payment }, key)
      setResult({ key, revision, payment, error: null, isLoading: false })
    }).catch((error: unknown) => {
      if (current()) setResult({ key, revision, isLoading: false, error: error instanceof Error ? error.message : 'Unable to prepare payment.' })
    })
    return () => controller.abort()
  }, [key, revision, enabled])
  const current = enabled && result.key === key && result.revision === revision
  return { payment: current ? result.payment : undefined, isLoading: enabled && (!current || result.isLoading), error: current ? result.error : null }
}
