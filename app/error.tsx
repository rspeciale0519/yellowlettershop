'use client'

import { ErrorBoundaryFallback } from '@/components/shared/error-boundary-fallback'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorBoundaryFallback error={error} reset={reset} />
}
