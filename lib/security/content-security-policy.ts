/**
 * Content-Security-Policy builder for next.config.
 * Origins come from env (NEXT_PUBLIC_SUPABASE_URL), never hardcoded secrets.
 */

export type SupabaseConnectOrigins = {
  https: string
  wss: string
}

export function supabaseConnectOrigins(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
): SupabaseConnectOrigins | null {
  if (!supabaseUrl) return null
  try {
    const url = new URL(supabaseUrl)
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return { https: url.origin, wss: `${wsProtocol}//${url.host}` }
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
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    'worker-src blob:',
    'frame-src https://js.stripe.com https://hooks.stripe.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
