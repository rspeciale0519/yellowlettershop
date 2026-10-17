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

export type WebhookTimestampCheck =
  | { ok: true }
  | { ok: false; error: string; status: 401 }

/** Require x-yls-timestamp and reject missing or stale values. */
export function requireWebhookTimestamp(
  timestamp: string | null | undefined,
  maxAgeSeconds = WEBHOOK_MAX_AGE_SECONDS,
  nowSeconds = Date.now() / 1000
): WebhookTimestampCheck {
  if (!isWebhookTimestampFresh(timestamp ?? undefined, maxAgeSeconds, nowSeconds)) {
    return { ok: false, error: 'Webhook timestamp missing or too old', status: 401 }
  }
  return { ok: true }
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

/** Inbound and outbound YLS webhooks sign `${unixSeconds}.${body}`. */
export function webhookSignedPayload(timestamp: string, body: string): string {
  return `${timestamp}.${body}`
}

export function signYlsWebhook(secret: string, timestamp: string, body: string): string {
  return `sha256=${hmacSha256Hex(secret, webhookSignedPayload(timestamp, body))}`
}

export type YlsWebhookCheck =
  | { ok: true }
  | { ok: false; error: string; status: 401 }

/**
 * Reject missing/stale x-yls-timestamp first (300s), then length-safe HMAC
 * over `${timestamp}.${body}`.
 */
export function verifyYlsWebhook(input: {
  timestamp: string | null | undefined
  body: string
  signature: string | undefined
  secret: string
  nowSeconds?: number
}): YlsWebhookCheck {
  const freshness = requireWebhookTimestamp(
    input.timestamp,
    WEBHOOK_MAX_AGE_SECONDS,
    input.nowSeconds ?? Date.now() / 1000
  )
  if (!freshness.ok) return freshness
  const signed = webhookSignedPayload(input.timestamp as string, input.body)
  if (!verifyHmacSha256Hex(input.secret, signed, input.signature)) {
    return { ok: false, error: 'Invalid signature', status: 401 }
  }
  return { ok: true }
}
