import { isBlockedIp, normalizeIp } from './blocked-ip'

const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google.internal.',
  'metadata',
])

/** True when `raw` is a public http(s) URL whose hostname is not a blocked literal. */
export function isSafeOutboundUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
  if (url.username || url.password) return false
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!host || host.endsWith('.local') || host.endsWith('.internal')) return false
  if (BLOCKED_HOSTS.has(host)) return false
  if (normalizeIp(host) && isBlockedIp(host)) return false
  return true
}

export function assertSafeOutboundUrl(raw: string): URL {
  if (!isSafeOutboundUrl(raw)) {
    throw new Error('Outbound URL is not allowed')
  }
  return new URL(raw)
}
