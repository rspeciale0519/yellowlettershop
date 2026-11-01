/**
 * Same-origin post-auth redirects only. External, protocol-relative, and
 * credential-bearing values fall back to a safe internal path.
 */
export function getSafeInternalPath(
  redirectedFrom?: string | null,
  fallback = '/dashboard'
): string {
  const raw = redirectedFrom?.trim()
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//') || raw.includes('\\') || raw.includes('://')) return fallback
  if (/[\u0000-\u001f]/.test(raw)) return fallback
  try {
    const url = new URL(raw, 'https://yls.invalid')
    if (url.origin !== 'https://yls.invalid') return fallback
    if (url.username || url.password) return fallback
    if (url.pathname.startsWith('//')) return fallback
    return `${url.pathname}${url.search}`
  } catch {
    return fallback
  }
}

/** Base URL for auth callbacks. Never trust X-Forwarded-Host. */
export function appOrigin(requestOrigin: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      /* fall through */
    }
  }
  return requestOrigin
}
