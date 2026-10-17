'use client'
import { useCallback, useEffect, useState } from 'react'
import type { PaymentMethod } from '../steps/payment/PaymentMethodList'
export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/methods')
      if (!response.ok) throw new Error('Unable to load saved cards. Please try again.')
      const data: PaymentMethod[] = await response.json()
      setMethods(data)
      setSelectedId(current => current ?? data.find(method => method.isDefault)?.id ?? null)
      setError(null)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load saved cards.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { methods, selectedId, setSelectedId, isLoading, error, reload }
}
