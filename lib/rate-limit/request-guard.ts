import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/security/client-ip'
import { rateLimitActor } from './actor'
import type { RateLimitFailureMode } from './policy'

export { clientIp, rateLimitActor }

export async function rateLimitResponse(
  scope: string,
  request: Request,
  maxRequests: number,
  windowSeconds: number,
  options: { userId?: string | null; failureMode?: RateLimitFailureMode } = {}
): Promise<NextResponse | null> {
  const decision = await checkRateLimit(
    scope,
    rateLimitActor(request, options.userId),
    maxRequests,
    windowSeconds,
    options.failureMode
  )
  if (decision.allowed) return null
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
