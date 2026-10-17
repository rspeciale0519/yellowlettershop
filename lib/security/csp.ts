/** Fail closed before a configured URL can introduce a CSP source/directive. */
export function buildCsp(supabaseUrl?: string, development = false): string {
  const origins: string[] = []
  if (supabaseUrl !== undefined) {
    try {
      if (!supabaseUrl || /[\s;,'"<>\\]/.test(supabaseUrl)) throw new Error()
      const url = new URL(supabaseUrl)
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      const dnsHost = url.hostname.length <= 253 && url.hostname.split('.').every(label => label.length <= 63 && /^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(label))
      if (!dnsHost && url.hostname !== '[::1]') throw new Error()
      if (url.protocol !== 'https:' && !(development && local && url.protocol === 'http:')) throw new Error()
      if (!url.hostname || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
      origins.push(url.origin, url.origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:'))
    } catch {
      throw new Error('Invalid Supabase URL for Content-Security-Policy')
    }
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''} https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https://api.stripe.com ${origins.join(' ')}${development ? ' ws://localhost:3010' : ''}`.trim(),
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}
