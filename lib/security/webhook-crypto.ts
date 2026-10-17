import crypto from 'crypto'

export const WEBHOOK_MAX_AGE_SECONDS = 300

export function timingSafeEqualHex(left: string, right: string): boolean {
  try {
    const a = Buffer.from(left, 'hex')
    const b = Buffer.from(right, 'hex')
    if (a.length === 0 || a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Mailgun-style unix-second timestamp must be within `maxAgeSeconds`. */
export function isWebhookTimestampFresh(
  timestamp: string | undefined,
  maxAgeSeconds = WEBHOOK_MAX_AGE_SECONDS,
  nowSeconds = Date.now() / 1000
): boolean {
  if (!timestamp) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || ts <= 0) return false
  return Math.abs(nowSeconds - ts) <= maxAgeSeconds
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex')
}

export function verifyHmacSha256Hex(
  secret: string,
  payload: string,
  signature: string | undefined
): boolean {
  if (!signature) return false
  const provided = signature.replace(/^sha256=/, '')
  return timingSafeEqualHex(hmacSha256Hex(secret, payload), provided)
}
