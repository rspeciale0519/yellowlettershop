import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware'
import { rateLimitResponse } from '@/lib/rate-limit/request-guard'

export interface ProtectedRouteOptions {
  rateLimit?: { scope: string; max: number; windowSeconds: number }
}

export function withProtectedRoute<TRoute = unknown>(
  handler: (
    request: NextRequest,
    context: AuthenticatedRequest,
    routeContext: TRoute
  ) => Promise<NextResponse>,
  options: ProtectedRouteOptions = {}
) {
  return withAuth<TRoute>(async (request, context, routeContext) => {
    if (options.rateLimit) {
      const limited = await rateLimitResponse(
        options.rateLimit.scope,
        request,
        options.rateLimit.max,
        options.rateLimit.windowSeconds,
        { userId: context.userId }
      )
      if (limited) return limited
    }
    return handler(request, context, routeContext)
  })
}
