import { clientIp } from '../security/client-ip'

export function rateLimitActor(request: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`
  return `ip:${clientIp(request)}`
}
