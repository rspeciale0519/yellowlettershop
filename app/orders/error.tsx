'use client'

import { ErrorBoundaryFallback } from '@/components/shared/error-boundary-fallback'

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundaryFallback
      error={error}
      reset={reset}
      title="There was a problem with your order"
      description="Something interrupted the order workflow. No payment is captured until you approve your proof, so nothing was charged. Please try again."
      homeHref="/dashboard/orders"
      homeLabel="View my orders"
    />
  )
}
