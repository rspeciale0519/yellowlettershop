'use client'
import { useEffect, useRef, useState } from 'react'
import type { OrderState, PricingBreakdown, OrderWorkflowContextType } from '../../../types/orders'
import { isFinalOrderQuote, orderQuoteKey } from '../../../lib/orders/quote-state'
import { requestJson } from './request-json'
export function useOrderProof(state: OrderState, pricing: PricingBreakdown | undefined, update: OrderWorkflowContextType['updateOrderState']) {
  const key = orderQuoteKey(state)
  const revision = pricing?.quoteRevision
  const enabled = isFinalOrderQuote(pricing)
  const latest = useRef({ state, key, revision, update })
  latest.current = { state, key, revision, update }
  const [result, setResult] = useState<{ key: string; revision?: string; url?: string; error: string | null; isLoading: boolean }>({ key: '', error: null, isLoading: false })
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const current = () => !controller.signal.aborted && latest.current.key === key && latest.current.revision === revision
    setResult({ key, revision, isLoading: true, error: null })
    latest.current.update({ proofPending: true, proofQuoteRevision: undefined }, key)
    void requestJson<{ proofUrl: string; quoteRevision: string }>('/api/orders/proof', { orderState: latest.current.state, quoteRevision: revision }, controller.signal).then(proof => {
      if (!current()) return
      if (proof.quoteRevision !== revision) throw new Error('The quote changed. Refresh the quote and proof before approval.')
      setResult({ key, revision, url: proof.proofUrl, error: null, isLoading: false })
      latest.current.update({ proofPending: false, proofQuoteRevision: revision }, key)
    }).catch((error: unknown) => { if (current()) {
      setResult({ key, revision, isLoading: false, error: error instanceof Error ? error.message : 'Unable to generate the proof.' })
      latest.current.update({ proofPending: false, proofQuoteRevision: undefined, approval: undefined }, key)
    } })
    return () => controller.abort()
  }, [key, revision, enabled])
  const current = enabled && result.key === key && result.revision === revision
  return { url: current ? result.url : undefined, error: current ? result.error : null, isLoading: enabled && (!current || result.isLoading) }
}
