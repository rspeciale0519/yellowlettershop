import 'server-only'
import { createClient } from '@/utils/supabase/service'
import {
  evaluateRateLimit,
  rateLimitKey,
  type RateLimitDecision,
  type RateLimitFailureMode,
} from './policy'

/**
 * Distributed rate limit backed by the `increment_rate_limit` Postgres RPC, so
 * the count is shared across all serverless instances (the old in-memory Map
 * reset per cold start and was bypassable across instances).
 *
 * On store error the decision follows `failureMode`. Defaults to 'closed'
 * (deny) so security-sensitive scopes are not bypassable by inducing errors;
 * pass 'open' explicitly for low-risk scopes that prefer availability.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string | null | undefined,
  maxRequests: number,
  windowSeconds: number,
  failureMode: RateLimitFailureMode = 'closed'
): Promise<RateLimitDecision> {
  const key = rateLimitKey(scope, identifier)
  const onError = (): RateLimitDecision =>
    evaluateRateLimit(0, maxRequests, failureMode)
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      p_key: key,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error(`Rate limit store error for ${key}:`, error)
      return onError()
    }
    return evaluateRateLimit(typeof data === 'number' ? data : 0, maxRequests, failureMode)
  } catch (err) {
    console.error(`Rate limit check failed for ${key}:`, err)
    return onError()
  }
}
