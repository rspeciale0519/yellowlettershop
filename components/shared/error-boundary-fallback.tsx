'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  homeHref?: string
  homeLabel?: string
}

/** Shared fallback UI for Next.js App Router error.tsx segment boundaries. */
export function ErrorBoundaryFallback({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error interrupted this page. Your data is safe — please try again.',
  homeHref = '/dashboard',
  homeLabel = 'Back to dashboard',
}: Props) {
  useEffect(() => {
    console.error('Boundary caught:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mb-6 text-gray-600">{description}</p>
        {error?.digest && (
          <p className="mb-6 font-mono text-xs text-gray-400">Reference: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
