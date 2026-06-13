import 'server-only'
import { createClient } from '@/utils/supabase/service'
import { evaluateRateLimit, rateLimitKey, type RateLimitDecision } from './policy'

/**
 * Distributed rate limit backed by the `increment_rate_limit` Postgres RPC, so
 * the count is shared across all serverless instances (the old in-memory Map
 * reset per cold start and was bypassable across instances).
 *
 * Fails OPEN on any store error — availability over strictness for a limiter.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string | null | undefined,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitDecision> {
  const key = rateLimitKey(scope, identifier)
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      p_key: key,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error(`Rate limit store error for ${key}:`, error)
      return { allowed: true, remaining: maxRequests }
    }
    return evaluateRateLimit(typeof data === 'number' ? data : 0, maxRequests)
  } catch (err) {
    console.error(`Rate limit check failed for ${key}:`, err)
    return { allowed: true, remaining: maxRequests }
  }
}
