// Pure rate-limit decision logic, separated from the store so it is unit
// testable. The store (Supabase RPC) supplies the post-increment count; this
// decides allow/block.

export interface RateLimitDecision {
  allowed: boolean
  remaining: number
}

export function rateLimitKey(scope: string, identifier: string | null | undefined): string {
  return `${scope}:${identifier || 'unknown'}`
}

/**
 * Decide from the current window count. A non-positive count means the store
 * call failed — fail OPEN (allow) so an infra hiccup never blocks real users.
 */
export function evaluateRateLimit(currentCount: number, maxRequests: number): RateLimitDecision {
  if (currentCount <= 0) return { allowed: true, remaining: maxRequests }
  return {
    allowed: currentCount <= maxRequests,
    remaining: Math.max(0, maxRequests - currentCount),
  }
}
