import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { clientIp } from '@/lib/security/client-ip'

export { clientIp }

export async function rateLimitResponse(
  scope: string,
  request: Request,
  maxRequests: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const decision = await checkRateLimit(scope, clientIp(request), maxRequests, windowSeconds)
  if (decision.allowed) return null
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
