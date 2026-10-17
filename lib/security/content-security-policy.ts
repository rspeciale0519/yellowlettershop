/**
 * Content-Security-Policy builder for next.config.
 * Origins come from env (NEXT_PUBLIC_SUPABASE_URL), never hardcoded secrets.
 */

export type SupabaseConnectOrigins = {
  https: string
  wss: string
}

export function supabaseConnectOrigins(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  development = process.env.NODE_ENV === 'development',
): SupabaseConnectOrigins | null {
  if (supabaseUrl === undefined) return null
  try {
    if (!supabaseUrl || /[\s;,'"<>\\]/.test(supabaseUrl)) throw new Error()
    const url = new URL(supabaseUrl)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    const dnsHost = url.hostname.length <= 253 && url.hostname.split('.').every(label => label.length <= 63 && /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label))
    if (!dnsHost && url.hostname !== '[::1]') throw new Error()
    if (url.protocol !== 'https:' && !(development && local && url.protocol === 'http:')) throw new Error()
    if (!url.hostname || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
    return { https: url.origin, wss: url.origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') }
  } catch { throw new Error('Invalid Supabase URL for Content-Security-Policy') }
}

/**
 * Tight CSP: no 'unsafe-eval', no https: script/frame/connect wildcards.
 * 'unsafe-inline' stays on script-src because Next.js App Router hydration
 * injects inline scripts. Designer keeps blob workers plus data/blob/https images
 * and data fonts.
 */
export function buildContentSecurityPolicy(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  development = process.env.NODE_ENV === 'development',
): string {
  const origins = supabaseConnectOrigins(supabaseUrl, development)
  const connectSrc = ["'self'", 'https://api.stripe.com']
  if (origins) {
    connectSrc.push(origins.https, origins.wss)
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // img-src keeps https: for remote designer images (user assets, stock, proofs).
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc.join(' ')}`,
    "worker-src 'self' blob:",
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com${origins ? ' ' + origins.https : ''}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
