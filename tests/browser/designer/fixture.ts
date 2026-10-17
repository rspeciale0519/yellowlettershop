import { test as base, expect } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'

/** Synthetic auth and intercepted APIs: no real account or server writes. */
export const test = base.extend({
  page: async ({ page, context, baseURL }, runTest) => {
    const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'designer@example.test', user_metadata: {}, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
    const expiry = Math.floor(Date.now() / 1000) + 3600
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: user.aud, exp: expiry })}.test-only`
    const session = { access_token: token, refresh_token: 'test-only', token_type: 'bearer', expires_in: 3600, expires_at: expiry, user }
    // Restore via token refresh so the global auth modal sees TOKEN_REFRESHED,
    // rather than treating a restored synthetic session as a fresh sign-in.
    const storedSession = { ...session, expires_at: Math.floor(Date.now() / 1000) - 1 }
    await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${encode(storedSession)}`, url: baseURL! }])
    await context.addInitScript((value) => localStorage.setItem('sb-127-auth-token', value), JSON.stringify(storedSession))
    const pdf = await PDFDocument.create()
    pdf.addPage(); pdf.addPage()
    const proof = await pdf.save()
    await context.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort()
      const json = (body: unknown, status = 200) => route.fulfill({ status, json: body, headers: { 'Access-Control-Allow-Origin': baseURL! } })
      if (url.pathname === '/auth/v1/user') return json(user)
      if (url.pathname.startsWith('/auth/v1/')) return json(session)
      if (url.pathname === '/test-proof.pdf') return route.fulfill({ contentType: 'application/pdf', body: Buffer.from(proof) })
      if (url.pathname === '/api/design/preview') return json({ pdfUrl: '/test-proof.pdf', widthIn: 8.5, heightIn: 11, dpi: 300 })
      if (url.pathname.startsWith('/dashboard')) return json({ error: 'Protected pages are outside this fixture' }, 404)
      if (url.pathname.startsWith('/api/')) {
        if (request.method() !== 'GET') return json({ error: 'Browser test: writes disabled' }, 503)
        if (url.pathname === '/api/designer/fonts') return json({ fonts: [] })
        if (url.pathname === '/api/designer/recipients') return json({ lists: [], records: [] })
        return json([])
      }
      return route.continue()
    })
    await runTest(page)
  },
})
export { expect }
