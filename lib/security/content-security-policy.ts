/**
 * Content-Security-Policy builder for next.config.
 * Origins come from env (NEXT_PUBLIC_SUPABASE_URL), never hardcoded secrets.
 */

export type SupabaseConnectOrigins = {
  https: string
  wss: string
}

const UNSAFE_CSP_ORIGIN = /[;\s,'"]/

function isSafeCspOrigin(origin: string): boolean {
  if (!origin || origin === 'null') return false
  return !UNSAFE_CSP_ORIGIN.test(origin)
}

export function supabaseConnectOrigins(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
): SupabaseConnectOrigins | null {
  if (!supabaseUrl) return null
  try {
    const url = new URL(supabaseUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!isSafeCspOrigin(url.origin)) return null
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const wss = `${wsProtocol}//${url.host}`
    if (!isSafeCspOrigin(wss)) return null
    return { https: url.origin, wss }
  } catch {
    return null
  }
}

/**
 * Tight CSP: no 'unsafe-eval', no https: script/frame/connect wildcards.
 * 'unsafe-inline' stays on script-src because Next.js App Router hydration
 * injects inline scripts. Designer keeps blob workers plus data/blob/https images
 * and data fonts.
 */
export function buildContentSecurityPolicy(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
): string {
  const origins = supabaseConnectOrigins(supabaseUrl)
  const connectSrc = ["'self'", 'https://api.stripe.com']
  if (origins) {
    connectSrc.push(origins.https, origins.wss)
  }

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    // img-src keeps https: for remote designer images (user assets, stock, proofs).
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    'worker-src blob:',
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
