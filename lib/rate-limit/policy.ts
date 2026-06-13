// Pure rate-limit decision logic, separated from the store so it is unit
// testable. The store (Supabase RPC) supplies the post-increment count; this
// decides allow/block.

export interface RateLimitDecision {
  allowed: boolean
  remaining: number
}

/**
 * What to do when the store can't give a count (count <= 0 sentinel):
 * - 'open'  → allow (availability-first; fine for low-risk read scopes)
 * - 'closed'→ deny (security-first; use for auth/payment/abuse-sensitive scopes)
 */
export type RateLimitFailureMode = 'open' | 'closed'

export function rateLimitKey(scope: string, identifier: string | null | undefined): string {
  return `${scope}:${identifier || 'unknown'}`
}

/**
 * Decide from the current window count. A non-positive count means the store
 * call failed; the caller's failureMode decides allow vs deny. Defaults to
 * 'closed' so a forgotten call site fails safe, not exploitable.
 */
export function evaluateRateLimit(
  currentCount: number,
  maxRequests: number,
  failureMode: RateLimitFailureMode = 'closed'
): RateLimitDecision {
  if (currentCount <= 0) {
    return { allowed: failureMode === 'open', remaining: failureMode === 'open' ? maxRequests : 0 }
  }
  return {
    allowed: currentCount <= maxRequests,
    remaining: Math.max(0, maxRequests - currentCount),
  }
}
