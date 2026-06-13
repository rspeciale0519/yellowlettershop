// Pure webhook retry policy — exponential backoff + retryability decision.
// Separated from delivery I/O so it is unit-testable.

export const MAX_WEBHOOK_ATTEMPTS = 5
const DEFAULT_BASE_MS = 1000
const DEFAULT_CEIL_MS = 60_000

/** Exponential backoff: base * 2^(attempt-1), capped at ceiling. */
export function backoffDelayMs(
  attempt: number,
  baseMs: number = DEFAULT_BASE_MS,
  ceilMs: number = DEFAULT_CEIL_MS
): number {
  const n = Math.max(1, attempt)
  return Math.min(baseMs * 2 ** (n - 1), ceilMs)
}

/**
 * Retry on transient failures only: network errors (status 0), 429, and 5xx.
 * Permanent client errors (other 4xx) and successes are never retried, and we
 * stop once attempts reach MAX_WEBHOOK_ATTEMPTS.
 */
export function shouldRetry(status: number, attempt: number): boolean {
  if (attempt >= MAX_WEBHOOK_ATTEMPTS) return false
  if (status === 0) return true // network failure
  if (status === 429) return true
  return status >= 500 && status <= 599
}
