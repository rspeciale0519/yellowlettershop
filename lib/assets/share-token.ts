import { createHash } from 'crypto'

/** Maximum share-link lifetime. Chosen as 30 days so a leaked URL expires. */
export const SHARE_LINK_MAX_DAYS = 30

export function hashShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function shareLinkIsExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  const expiry = expiresAt ? new Date(expiresAt).getTime() : NaN
  return !Number.isFinite(expiry) || expiry <= now.getTime()
}

export function parseShareExpiryDays(value: unknown): { ok: true; days: number } | { ok: false; error: string } {
  const days = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(days) || days < 1 || days > SHARE_LINK_MAX_DAYS) {
    return {
      ok: false,
      error: `Expiry is required and must be an integer between 1 and ${SHARE_LINK_MAX_DAYS} days`,
    }
  }
  return { ok: true, days }
}
