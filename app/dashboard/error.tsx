'use client'

import { ErrorBoundaryFallback } from '@/components/shared/error-boundary-fallback'

export default function DashboardError({
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
      title="This page hit a snag"
      description="We couldn't finish loading this view. Your account and data are unaffected. Please try again."
    />
  )
}
