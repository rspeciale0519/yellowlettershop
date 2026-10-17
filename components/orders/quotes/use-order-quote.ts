'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { OrderState, OrderWorkflowContextType, PricingBreakdown } from '../../../types/orders'
import { orderQuoteKey } from '../../../lib/orders/quote-state'
import { requestJson } from './request-json'

type QuoteState = { key: string; pricing?: PricingBreakdown; isLoading: boolean; error: string | null }
export function useOrderQuote(state: OrderState, update: OrderWorkflowContextType['updateOrderState']) {
  const key = orderQuoteKey(state)
  const latest = useRef({ state, key, update })
  latest.current = { state, key, update }
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<QuoteState>({ key: '', isLoading: true, error: null })
  useEffect(() => {
    const controller = new AbortController()
    const snapshot = latest.current.state
    const current = () => !controller.signal.aborted && latest.current.key === key
    setResult({ key, isLoading: true, error: null })
    latest.current.update({ quotePending: true }, key)
    void requestJson<PricingBreakdown>('/api/orders/pricing', { orderState: snapshot }, controller.signal).then(pricing => {
      if (!current()) return
      setResult({ key, pricing, isLoading: false, error: null })
      latest.current.update({ pricing, quotePending: false }, key)
    }).catch((error: unknown) => {
      if (!current()) return
      setResult({ key, isLoading: false, error: error instanceof Error ? error.message : 'Unable to quote this order.' })
      latest.current.update({ pricing: undefined, quotePending: false }, key)
    })
    return () => { controller.abort() }
  }, [key, attempt])
  const refresh = useCallback(() => {
    setResult({ key: latest.current.key, isLoading: true, error: null })
    latest.current.update({ pricing: undefined, quotePending: true }, latest.current.key)
    setAttempt(value => value + 1)
  }, [])
  const current = result.key === key
  const acceptPricing = useCallback((pricing: PricingBreakdown, expectedKey: string) => {
    if (latest.current.key !== expectedKey) return
    setResult({ key: expectedKey, pricing, isLoading: false, error: null })
    latest.current.update({ pricing, quotePending: false }, expectedKey)
  }, [])
  const pricing = current && !result.isLoading ? result.pricing : undefined
  return { key, pricing, isLoading: !current || result.isLoading, error: current ? result.error : null, refresh, acceptPricing }
}
