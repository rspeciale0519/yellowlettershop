import { test as base, expect } from '@playwright/test'
import { renderDesignToPdf } from '../../../app/api/design/preview/_render/pdf-renderer'
import { buildTokenContext } from '../../../components/designer/tokens/recipient-map'
import { provisionalOrderQuote } from '../../../lib/orders/server-quote'
import { DEFAULT_PRICING } from '../../../lib/orders/pricing'
import { mkdirSync, writeFileSync } from 'node:fs'
import type { DesignerDocument } from '../../../types/designer'

/** Synthetic auth and intercepted APIs: no real account or server writes. */
export const test = base.extend({
  page: async ({ page, context, baseURL }, runTest) => {
    page.on('pageerror', error => console.error(error.stack))
    const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'designer@example.test', user_metadata: {}, app_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
    const expiry = Math.floor(Date.now() / 1000) + 3600
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: user.aud, exp: expiry })}.test-only`
    const session = { access_token: token, refresh_token: 'test-only', token_type: 'bearer', expires_in: 3600, expires_at: expiry, user }
    // Exercise a valid restored session; it must not redirect the current designer.
    const storedSession = session
    await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${encode(storedSession)}`, url: baseURL! }])
    await context.addInitScript(({ value, cookie }) => {
      localStorage.setItem('sb-127-auth-token', value)
      // Restore the same valid session on full loads, including reloads.
      if (location.pathname === '/design/customize') document.cookie = `sb-127-auth-token=${cookie}; path=/; SameSite=Lax`
    }, { value: JSON.stringify(storedSession), cookie: `base64-${encode(storedSession)}` })
    const proofs = new Map<string,Uint8Array>()
    let proofIndex=0
    await context.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort()
      const json = (body: unknown, status = 200) => route.fulfill({ status, json: body, headers: { 'Access-Control-Allow-Origin': baseURL! } })
      if (url.pathname === '/auth/v1/user') return json(user)
      if (url.pathname.startsWith('/auth/v1/')) return json(session)
      if (proofs.has(url.pathname)) return route.fulfill({contentType:'application/pdf',body:Buffer.from(proofs.get(url.pathname)!)})
      if (url.pathname === '/api/design/preview') {
        const payload=request.postDataJSON()
        const doc=payload.designState as DesignerDocument
        const bytes=await renderDesignToPdf(doc,buildTokenContext(payload.recipient,payload.sender ?? {}),doc.formatId ?? 'letter_8_5x11',doc.orientation)
        const path=`/test-proof-${++proofIndex}.pdf`;proofs.set(path,bytes)
        mkdirSync('/workspace/scratch/designer-verification',{recursive:true})
        writeFileSync(`/workspace/scratch/designer-verification/${doc.templateId}-proof.pdf`,bytes)
        return json({pdfUrl:path,widthIn:8.75,heightIn:11.25,dpi:300})
      }
      if (url.pathname === '/api/orders/pricing') {
        try{return json(provisionalOrderQuote(request.postDataJSON().orderState,DEFAULT_PRICING).pricing)}catch(error){return json({error:error instanceof Error?error.message:'Quote unavailable'},400)}
      }
      if (url.pathname.startsWith('/api/orders/drafts/') && request.method()==='GET') return json({orderState:{orderId:url.pathname.split('/').at(-1)}})
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
