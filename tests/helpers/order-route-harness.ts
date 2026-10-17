import Module, { createRequire } from 'module'
const importModule = createRequire(__filename)
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { DEFAULT_PRICING } from '../../lib/orders/pricing'
import { artwork, quoteDatabase, quoteState } from './quote-fixtures'

export const runtime = {
  db: quoteDatabase().db, state: quoteState,
  intent: { id: 'pi_test', amount: 1, status: 'requires_capture', currency: 'usd', capture_method: 'manual', metadata: { user_id: 'owner' } as Record<string, string>, customer: 'cus_test', client_secret: 'secret' },
  created: {} as Record<string, unknown>, confirmed: 0, attached: 0, inserted: {} as Record<string, unknown>,
}
class FakeStripe {
  static errors = Stripe.errors
  customers = { create: async () => ({ id: 'cus_test' }) }
  paymentMethods = { attach: async () => { runtime.attached++; return {} } }
  paymentIntents = {
    retrieve: async () => runtime.intent,
    create: async (input: Record<string, unknown>) => { runtime.created = input; return { ...runtime.intent, ...input } },
    confirm: async () => { runtime.confirmed++; return runtime.intent },
  }
}
export function resetRuntime() {
  runtime.db = quoteDatabase(artwork(true)).db
  runtime.state = quoteState
  runtime.created = {}; runtime.confirmed = 0; runtime.attached = 0; runtime.inserted = {}
  runtime.intent = { ...runtime.intent, amount: 1, status: 'requires_capture', metadata: { user_id: 'owner' } }
  const originalFrom = runtime.db.from.bind(runtime.db)
  runtime.db.from = ((table: string) => {
    if (table === 'user_profiles') {
      const query = { select: () => query, eq: () => query, single: async () => ({ data: { stripe_customer_id: 'cus_test' } }) }
      return query
    }
    if (table === 'orders') {
      const query = { insert: (input: Record<string, unknown>) => { runtime.inserted = input; return query }, select: () => query, single: async () => ({ data: { id: 'order-test' }, error: null }) }
      return query
    }
    return originalFrom(table)
  }) as typeof runtime.db.from
}
export function loadRoute(path: string) {
  const mocks: Record<string, unknown> = {
    '../../lib/auth/middleware': { withAuth: (handler: unknown) => handler },
    '../../utils/supabase/service': { createClient: () => runtime.db },
    '../../lib/orders/pricing-config': { loadPricingConfig: async () => DEFAULT_PRICING },
    '../../lib/orders/generate-proof': { generateProofForOrder: async () => ({ ok: true }), getUserEmail: async () => 'test@example.test' },
    '../../lib/email': { trySendEmail: async () => undefined },
    stripe: FakeStripe,
  }
  const previous = new Map<string, NodeModule | undefined>()
  try {
    for (const [name, value] of Object.entries(mocks)) {
      const resolved = importModule.resolve(name)
      previous.set(resolved, importModule.cache[resolved])
      const entry = new Module(resolved)
      entry.exports = value
      importModule.cache[resolved] = entry
    }
    const resolvedRoute = importModule.resolve(path)
    delete importModule.cache[resolvedRoute]
    return importModule(path) as { POST: (req: NextRequest, auth: { userId: string }) => Promise<Response> }
  } finally {
    for (const [name, value] of previous) {
      if (value) importModule.cache[name] = value
      else delete importModule.cache[name]
    }
  }
}
export async function post(route: ReturnType<typeof loadRoute>, body: unknown) {
  return route.POST(new Request('http://localhost/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) as NextRequest, { userId: 'owner' })
}
