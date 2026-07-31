# Vendor Fulfillment Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the order lifecycle from "payment captured" to "printed, mailed, delivered" — vendor selection, dispatch email with print package, status advancement with tracking, customer ship notification — and finish the inline-payment refactor so admin revenue/capture/refund actually work.

**Architecture:** Three workstreams. (1) Finish the June inline-on-orders payment model: kill all 6 `payment_transactions` references (table never existed), fix `lib/admin/order-service.ts` schema drift (`user_id` → `created_by`), add refund columns + `cancelled` status via migration. (2) New `order_dispatches` table + `lib/fulfillment/` service: pure logic in `dispatch-core.ts` (unit-tested), IO in `dispatch-service.ts`; dispatch = pick active print vendor → build recipients CSV + signed proof URL → email vendor → record dispatch row; status updates advance `orders.status` and email the customer on ship. (3) Admin API + minimal UI panel (deliberately plain — the Masthead redesign re-skins it later). Auto-dispatch fires after proof-approval capture, non-fatally.

**Tech Stack:** Next.js 15 App Router API routes, Supabase (service client + SQL migration + RLS), Stripe (existing manual-capture), `lib/email/` adapter (Resend/Mailgun), Mocha+chai tests (`tests/**/*.test.ts`, run `npm test`).

## Global Constraints

- Branch: run `/git-workflow-planning:start feature vendor-fulfillment` BEFORE any code (Rule 8). Phase ends: update `ylsbrain/knowledge/roadmap.md` (this project's roadmap — Rule 7), then `/git-workflow-planning:checkpoint <phase> "<desc>"`.
- Files ≤350 LOC; strict TS (no `any`); Zod on all API inputs; follow existing patterns.
- **Money units:** `orders.amount_captured/total_cost/amount_refunded` are DOLLARS (numeric). Stripe returns CENTS — divide by 100 exactly once, at the Stripe boundary. (The dead `payment_transactions` code stored cents; do NOT copy its `/100` into aggregation code.)
- All new tables: RLS enabled, service-role/owner policies only (follow `20260613100000_webhook_events.sql` pattern).
- Emails via existing `trySendEmail(to, content)` — never throw on email failure; log loudly.
- Gates per checkpoint: `npm test` green, `npm run typecheck:full` 0 errors, `npm run lint` no NEW problems (repo has ~743 pre-existing — delta gate).
- Test file pattern: `tests/<area>/<name>.test.ts`. **House style (verified from `tests/lib/orders/order-summary.test.ts`): `import { describe, it } from 'mocha'` + `import { strict as assert } from 'assert'` + RELATIVE imports** (`../../../lib/...`) — the mocha tsconfig does not resolve `@/` aliases, and no existing test uses chai. Test snippets below follow this style; where a snippet says `assert.deepEqual`, that is node assert/strict.

---

## Phase 1 — Inline-payment refactor (fixes admin revenue, capture/refund, schema drift)

### Task 1: Migration — refund columns + `cancelled` status

**Files:**
- Create: `supabase/migrations/20260801000000_orders_refund_columns.sql`

**Interfaces:**
- Produces: `orders.captured_at timestamptz`, `orders.amount_refunded numeric(10,2)`, `orders.refunded_at timestamptz`, order_status enum value `'cancelled'`. Later tasks read/write these exact names.

- [ ] **Step 1: Write the migration**

```sql
-- Inline-payment model completion: refund tracking lives on orders (there is
-- no payment_transactions table and never was). 'cancelled' backs the existing
-- refund path in lib/admin/order-service.ts which already writes it.
-- PG12+: ADD VALUE is transaction-safe as long as this migration doesn't USE it.
alter type public.order_status add value if not exists 'cancelled';

alter table public.orders
  add column if not exists captured_at timestamp with time zone,
  add column if not exists amount_refunded numeric(10,2),
  add column if not exists refunded_at timestamp with time zone;

comment on column public.orders.amount_refunded is 'Dollars. Cumulative refunded amount (Stripe cents / 100).';
```

- [ ] **Step 2: Apply locally and verify**

Run: `supabase migration up` (local Docker stack) then
`supabase db execute "select column_name from information_schema.columns where table_name='orders' and column_name in ('captured_at','amount_refunded','refunded_at')"`
Expected: 3 rows. Also `select unnest(enum_range(null::order_status));` includes `cancelled`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260801000000_orders_refund_columns.sql
git commit -m "feat(db): orders refund columns + cancelled status (inline-payment model)"
```

### Task 2: Pure analytics aggregation module (TDD)

**Files:**
- Create: `lib/admin/analytics-core.ts`
- Test: `tests/lib/admin/analytics-core.test.ts`

**Interfaces:**
- Produces (consumed by Task 3):
  - `interface RevenueOrderRow { amount_captured: number | null; amount_refunded?: number | null; captured_at?: string | null; updated_at?: string | null; created_at?: string | null; created_by?: string | null }`
  - `netRevenue(rows: RevenueOrderRow[]): number` — dollars: Σ amount_captured − Σ amount_refunded.
  - `revenueByDay(rows: RevenueOrderRow[]): { date: string; revenue: number; orders: number }[]` — buckets by `(captured_at ?? updated_at ?? created_at).slice(0,10)`, ascending; skips rows with null amount_captured.
  - `topCustomerTotals(rows: RevenueOrderRow[]): { userId: string; total: number; orderCount: number }[]` — grouped by `created_by`, sorted desc by total; skips null created_by/amount.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { netRevenue, revenueByDay, topCustomerTotals } from '../../../lib/admin/analytics-core'

describe('analytics-core', () => {
  const rows = [
    { amount_captured: 217.5, captured_at: '2026-08-01T10:00:00Z', created_by: 'u1' },
    { amount_captured: 100, amount_refunded: 25, captured_at: '2026-08-01T12:00:00Z', created_by: 'u2' },
    { amount_captured: 50, captured_at: null, updated_at: '2026-08-02T09:00:00Z', created_by: 'u1' },
    { amount_captured: null, created_at: '2026-08-02T09:00:00Z', created_by: 'u3' },
  ]
  it('netRevenue sums dollars minus refunds, no cents conversion', () => {
    assert.equal(netRevenue(rows), 217.5 + 100 + 50 - 25)
  })
  it('revenueByDay buckets by capture date with fallbacks, skips uncaptured', () => {
    assert.deepEqual(revenueByDay(rows), [
      { date: '2026-08-01', revenue: 317.5, orders: 2 },
      { date: '2026-08-02', revenue: 50, orders: 1 },
    ])
  })
  it('topCustomerTotals groups by created_by, sorted desc', () => {
    assert.deepEqual(topCustomerTotals(rows), [
      { userId: 'u1', total: 267.5, orderCount: 2 },
      { userId: 'u2', total: 100, orderCount: 1 },
    ])
  })
})
```

- [ ] **Step 2: Run to verify failure** — `npm test` → FAIL (module not found).

- [ ] **Step 3: Implement `lib/admin/analytics-core.ts`**

```typescript
export interface RevenueOrderRow {
  amount_captured: number | null
  amount_refunded?: number | null
  captured_at?: string | null
  updated_at?: string | null
  created_at?: string | null
  created_by?: string | null
}

const captureDate = (r: RevenueOrderRow) =>
  (r.captured_at ?? r.updated_at ?? r.created_at ?? '').slice(0, 10)

export function netRevenue(rows: RevenueOrderRow[]): number {
  return rows.reduce(
    (sum, r) => sum + (Number(r.amount_captured) || 0) - (Number(r.amount_refunded) || 0),
    0
  )
}

export function revenueByDay(rows: RevenueOrderRow[]) {
  const grouped: Record<string, { revenue: number; orders: number }> = {}
  for (const r of rows) {
    if (typeof r.amount_captured !== 'number') continue
    const date = captureDate(r)
    if (!date) continue
    grouped[date] ??= { revenue: 0, orders: 0 }
    grouped[date].revenue += r.amount_captured
    grouped[date].orders += 1
  }
  return Object.entries(grouped)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function topCustomerTotals(rows: RevenueOrderRow[]) {
  const totals: Record<string, { total: number; orderCount: number }> = {}
  for (const r of rows) {
    if (!r.created_by || typeof r.amount_captured !== 'number') continue
    totals[r.created_by] ??= { total: 0, orderCount: 0 }
    totals[r.created_by].total += r.amount_captured
    totals[r.created_by].orderCount += 1
  }
  return Object.entries(totals)
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.total - a.total)
}
```

- [ ] **Step 4: Run tests** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add lib/admin/analytics-core.ts tests/lib/admin/analytics-core.test.ts && git commit -m "feat(admin): pure revenue aggregation over inline-payment orders"`

### Task 3: Rewire `analytics-service.ts` off `payment_transactions`

**Files:**
- Modify: `lib/admin/analytics-service.ts` (lines 63-65, 118-135, 152-169 — the three `payment_transactions` query sites)

**Interfaces:**
- Consumes: Task 2 functions. Keeps existing exported signatures (`getAnalyticsMetrics`, `getRevenueTimeline`, `getTopCustomers`) unchanged — callers (`app/api/admin/analytics/*`, dashboard page) must not change.

- [ ] **Step 1: Replace the three query sites**

In `getAnalyticsMetrics` replace the three `payment_transactions` selects with ONE orders select, then derive the three windows in JS:

```typescript
const revenueRes = await supabase
  .from('orders')
  .select('amount_captured, amount_refunded, captured_at, updated_at, created_at')
  .not('amount_captured', 'is', null)
// windows:
const all = (revenueRes.data ?? []) as RevenueOrderRow[]
const inWindow = (r: RevenueOrderRow, from: string, to?: string) => {
  const d = r.captured_at ?? r.updated_at ?? r.created_at ?? ''
  return d >= from && (!to || d <= to)
}
const totalRevenue = netRevenue(all)
const thisMonthRevenue = netRevenue(all.filter((r) => inWindow(r, thisMonthStart)))
const lastMonthRevenue = netRevenue(all.filter((r) => inWindow(r, lastMonthStart, lastMonthEnd)))
```

Delete the local `sumAmounts` helper (it divides by 100 — cents logic, now wrong).

In `getRevenueTimeline`: same orders select with `.gte('captured_at', since)` replaced by client-side filter (captured_at may be null on legacy rows) → `revenueByDay(rows.filter(r => captureWindow))`. Simplest correct form: fetch `.not('amount_captured','is',null)`, filter `revenueByDay(all).filter(d => d.date >= since.slice(0,10))`.

In `getTopCustomers`: orders select `created_by, amount_captured` → `topCustomerTotals` → keep the existing profile-join code, substituting `userId` for the old `p.user_id` key.

- [ ] **Step 2: Gates** — `npm test` PASS; `npm run typecheck:full` 0 errors.
- [ ] **Step 3: Commit** — `git commit -am "fix(admin): analytics reads inline-payment orders (payment_transactions never existed)"`

### Task 4: Rewire `payment-intent-service.ts` to inline model

**Files:**
- Modify: `lib/payments/payment-intent-service.ts` (three `payment_transactions` sites at ~61-74, ~116-126, ~164-175)

**Interfaces:**
- Produces: `capturePayment()` return gains `amountReceived: number | null` (DOLLARS). `refundPayment()` unchanged signature. Order rows are located by `stripe_payment_intent_id` — set at submit (`lib/orders/order-insert.ts`); a PI created before submit has no order row yet, which is why `create()` must not write DB at all.

- [ ] **Step 1: `create()`** — delete the `payment_transactions` insert block entirely (the order row records the PI at submit; there is nothing to persist yet).
- [ ] **Step 2: `capturePayment()`** — replace the update with:

```typescript
const amountReceived =
  typeof paymentIntent.amount_received === 'number' ? paymentIntent.amount_received / 100 : null
const { error: updateError } = await this.supabase
  .from('orders')
  .update({
    payment_status: 'captured',
    amount_captured: amountReceived,
    captured_at: new Date().toISOString(),
  })
  .eq('stripe_payment_intent_id', paymentIntentId)
if (updateError) console.error('Failed to record capture on order:', updateError)
```

and include `amountReceived` in the return object.

- [ ] **Step 3: `refundPayment()`** — replace the update with:

```typescript
const { error: updateError } = await this.supabase
  .from('orders')
  .update({
    payment_status: 'refunded',
    amount_refunded: refund.amount / 100,
    refunded_at: new Date().toISOString(),
  })
  .eq('stripe_payment_intent_id', paymentIntentId)
```

- [ ] **Step 4: Gates + commit** — `npm test`, `typecheck:full` → `git commit -am "fix(payments): capture/refund persist inline on orders"`

### Task 5: Fix `lib/admin/order-service.ts` drift + payment sites

**Files:**
- Modify: `lib/admin/order-service.ts` (whole file — it is 179 lines, every function touched)
- Test: `tests/lib/admin/order-detail-shape.test.ts`

**Interfaces:**
- Consumes: Task 4's `capturePayment` (`amountReceived`).
- Produces: `getOrderDetail` returns `{ order, user, payments, timeline }` where `payments` is now derived: `[{ stripe_payment_intent_id, status: payment_status, amount: total_cost, amount_captured, amount_refunded, captured_at, refunded_at }]` (single-element array, or `[]` when no PI). Extract this as a pure exported helper `inlinePayments(order: Record<string, unknown>): Record<string, unknown>[]` so it's unit-testable. `assignVendor` is DELETED (no callers — replaced by Phase 2 dispatch service).

- [ ] **Step 1: Failing test for `inlinePayments`**

```typescript
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { inlinePayments } from '../../../lib/admin/order-service'

describe('inlinePayments', () => {
  it('derives a one-row payment view from inline order columns', () => {
    const rows = inlinePayments({
      stripe_payment_intent_id: 'pi_1', payment_status: 'captured',
      total_cost: 217.5, amount_captured: 217.5, amount_refunded: null,
      captured_at: '2026-08-01T10:00:00Z', refunded_at: null,
    })
    assert.equal(rows.length, 1)
    assert.equal(rows[0].stripe_payment_intent_id, 'pi_1')
    assert.equal(rows[0].status, 'captured')
    assert.equal(rows[0].amount_captured, 217.5)
  })
  it('returns [] when the order has no payment intent', () => {
    assert.deepEqual(inlinePayments({ stripe_payment_intent_id: null }), [])
  })
})
```

**Note (verified):** `lib/admin/order-service.ts` imports run at module scope with `createServiceClient` used only inside functions — importing `inlinePayments` in a mocha test is safe as long as `inlinePayments` stays a pure function with no client construction at module top-level. Keep it that way.

Run `npm test` → FAIL (not exported).

- [ ] **Step 2: Rewrite the file**
  - `listOrders`: select `'*'` (drop the `user_profiles!inner` join — no FK exists); filter `.eq('created_by', filters.userId)`; after fetch, batch-load profiles: `supabase.from('user_profiles').select('user_id, full_name, email').in('user_id', [...new Set(orders.map(o => o.created_by))])` and attach as `o.user_profiles` to preserve the response shape the admin UI reads.
  - `getOrderDetail`: drop the `payment_transactions` query; `payments: inlinePayments(orderRes.data)`; profile lookup `.eq('user_id', orderRes.data.created_by)`.
  - `captureOrderPayment`: after `service.capturePayment(...)` (which now persists inline — Task 4), update ONLY `status: 'processing'` on the order and keep the audit log. Delete the `payment_transactions` update.
  - `refundOrder`: keep `status: 'cancelled'` (now a real enum value) and keep audit log; inline persistence happens in Task 4's `refundPayment`.
  - Delete `assignVendor` entirely.
- [ ] **Step 3: Gates** — `npm test` PASS, `typecheck:full` 0.
- [ ] **Step 4: Commit** — `git commit -am "fix(admin): order service on created_by + inline payments; drop dead assignVendor"`

### Task 6: `user-service.ts` LTV + bare payment routes

**Files:**
- Modify: `lib/admin/user-service.ts` (lines ~47-52)
- Modify: `app/api/payments/capture-payment/route.ts`, `app/api/payments/refund-payment/route.ts`

**Interfaces:** none new.

- [ ] **Step 1: `user-service.ts`** — replace the `payment_transactions` select with `supabase.from('orders').select('id, status, payment_status, total_cost, amount_captured, amount_refunded, captured_at, created_at').eq('created_by', userId).order('created_at', { ascending: false }).limit(20)` and fix the sibling orders query on line 49-50 from `.eq('user_id', userId)` to `.eq('created_by', userId)`. Where the function computes lifetime value from transaction amounts, sum `amount_captured − amount_refunded` in dollars (read the surrounding lines; delete any `/100`).
- [ ] **Step 2: Archive the two dead routes** — verified 2026-07-31: `grep -r "capture-payment\|refund-payment" app components lib hooks` (excluding the route folders themselves) finds **zero callers**. Admin capture/refund already flows through `app/api/admin/orders/[orderId]/payment/route.ts`; the customer path captures via `orders/[orderId]/approve`. Per Rule 1, MOVE (don't delete) `app/api/payments/capture-payment/` and `app/api/payments/refund-payment/` to `archive/api-payments-2026-08/`. This removes two bare (unauthenticated) payment endpoints — re-verify the grep is still empty at execution time before moving.
- [ ] **Step 3: Verify zero references remain** — `grep -r payment_transactions app lib components` → 0 hits.
- [ ] **Step 4: Gates + commit** — `git commit -am "fix(admin): LTV from inline orders; admin-gate raw capture/refund routes"`
- [ ] **Step 5: Phase checkpoint** — update `ylsbrain/knowledge/roadmap.md` (mark the payment_transactions + drift items done), then `/git-workflow-planning:checkpoint 1 "inline-payment refactor complete"`

---

## Phase 2 — Dispatch core (schema + pure logic + service)

### Task 7: Migration — `order_dispatches`

**Files:**
- Create: `supabase/migrations/20260801010000_order_dispatches.sql`

**Interfaces:**
- Produces the table all Phase 2-4 code uses:

- [ ] **Step 1: Write the migration**

```sql
do $$ begin if not exists (select 1 from pg_type where typname='dispatch_status') then
  create type public.dispatch_status as enum
    ('sent', 'accepted', 'in_production', 'shipped', 'delivered', 'failed');
end if; end $$;

create table if not exists public.order_dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id),
  status dispatch_status not null default 'sent',
  package jsonb not null default '{}'::jsonb, -- { csvPath, proofPath, recordCount }
  tracking_number text,
  tracking_carrier text,
  error text,
  dispatched_at timestamptz not null default now(),
  accepted_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_by uuid not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_order_dispatches_order on public.order_dispatches(order_id);

alter table public.order_dispatches enable row level security;
-- Service-role only: dispatch is a server/admin concern; customers read status
-- via the orders API which already scopes by created_by.
create policy "service role full access" on public.order_dispatches
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
```

- [ ] **Step 2: Apply + verify** — `supabase migration up`; select from the table; confirm anon `select` is denied (RLS).
- [ ] **Step 3: Commit** — `git commit -am "feat(db): order_dispatches table + dispatch_status enum"`

### Task 8: Pure dispatch logic (TDD)

**Files:**
- Create: `lib/fulfillment/dispatch-core.ts`
- Test: `tests/fulfillment/dispatch-core.test.ts`

**Interfaces (produced — exact, used by Tasks 9-15):**

```typescript
export interface DispatchableOrder {
  id: string; status: string; payment_status: string | null
  stripe_payment_intent_id: string | null; record_count: number | null
  proof_urls?: unknown; metadata?: { order_state?: Record<string, unknown> } | null
}
export function canDispatch(order: DispatchableOrder): { ok: true } | { ok: false; reason: string }
export function buildRecipientCsv(records: Record<string, unknown>[]): string
export function vendorContactEmail(contactInfo: unknown): string | null
export type DispatchTransition = 'accepted' | 'in_production' | 'shipped' | 'delivered' | 'failed'
export function applyDispatchTransition(current: string, next: DispatchTransition):
  { ok: true; orderStatus: 'processing' | 'shipped' | 'completed' | null } | { ok: false; reason: string }
```

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  canDispatch, buildRecipientCsv, vendorContactEmail, applyDispatchTransition,
} from '../../lib/fulfillment/dispatch-core'

describe('canDispatch', () => {
  const base = { id: 'o1', status: 'processing', payment_status: 'captured',
    stripe_payment_intent_id: 'pi_1', record_count: 250 }
  it('allows a captured, processing order', () => {
    assert.deepEqual(canDispatch(base), { ok: true })
  })
  it('rejects uncaptured payment', () => {
    assert.equal(canDispatch({ ...base, payment_status: 'authorized' }).ok, false)
  })
  it('rejects wrong status', () => {
    assert.equal(canDispatch({ ...base, status: 'submitted' }).ok, false)
    assert.equal(canDispatch({ ...base, status: 'shipped' }).ok, false)
  })
})

describe('buildRecipientCsv', () => {
  it('emits the vendor column contract with escaping', () => {
    const csv = buildRecipientCsv([
      { first_name: 'Ann', last_name: 'O\'Hara', address_line_1: '1 Main St, Apt 2',
        address_line_2: '', city: 'Tampa', state: 'FL', zip_code: '33601',
        company: 'Acme "Co"', email: 'a@x.com', phone: '5551234567' },
    ])
    const lines = csv.trim().split('\n')
    assert.equal(lines[0],
      'Record_ID,First_Name,Last_Name,Address_1,Address_2,City,State,Zip_Code,Company,Email,Phone')
    assert.ok(lines[1].includes('"1 Main St, Apt 2"'))
    assert.ok(lines[1].includes('"Acme ""Co"""'))
    assert.ok(lines[1].startsWith('1,'))
  })
})

describe('vendorContactEmail', () => {
  it('reads email out of contact_info jsonb', () => {
    assert.equal(vendorContactEmail({ email: 'print@vendor.com', phone: 'x' }), 'print@vendor.com')
  })
  it('null for missing/invalid', () => {
    assert.equal(vendorContactEmail(null), null)
    assert.equal(vendorContactEmail({ phone: 'x' }), null)
  })
})

describe('applyDispatchTransition', () => {
  it('sent → accepted keeps order in processing', () => {
    assert.deepEqual(applyDispatchTransition('sent', 'accepted'), { ok: true, orderStatus: null })
  })
  it('in_production → shipped advances order to shipped', () => {
    assert.deepEqual(applyDispatchTransition('in_production', 'shipped'), { ok: true, orderStatus: 'shipped' })
  })
  it('shipped → delivered completes the order', () => {
    assert.deepEqual(applyDispatchTransition('shipped', 'delivered'), { ok: true, orderStatus: 'completed' })
  })
  it('rejects backwards transitions', () => {
    assert.equal(applyDispatchTransition('shipped', 'accepted').ok, false)
  })
})
```

- [ ] **Step 2: Run** — `npm test` → FAIL.
- [ ] **Step 3: Implement**

```typescript
export interface DispatchableOrder {
  id: string
  status: string
  payment_status: string | null
  stripe_payment_intent_id: string | null
  record_count: number | null
  proof_urls?: unknown
  metadata?: { order_state?: Record<string, unknown> } | null
}

export function canDispatch(order: DispatchableOrder): { ok: true } | { ok: false; reason: string } {
  if (order.status !== 'processing')
    return { ok: false, reason: `Order is ${order.status}; only captured 'processing' orders dispatch` }
  if (order.payment_status !== 'captured')
    return { ok: false, reason: 'Payment is not captured — never dispatch unpaid work' }
  return { ok: true }
}

const CSV_COLUMNS = ['Record_ID', 'First_Name', 'Last_Name', 'Address_1', 'Address_2',
  'City', 'State', 'Zip_Code', 'Company', 'Email', 'Phone'] as const
const FIELD_KEYS = ['first_name', 'last_name', 'address_line_1', 'address_line_2',
  'city', 'state', 'zip_code', 'company', 'email', 'phone'] as const

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildRecipientCsv(records: Record<string, unknown>[]): string {
  const rows = records.map((r, i) =>
    [i + 1, ...FIELD_KEYS.map((k) => r[k])].map(csvCell).join(','))
  return [CSV_COLUMNS.join(','), ...rows].join('\n') + '\n'
}

export function vendorContactEmail(contactInfo: unknown): string | null {
  if (contactInfo && typeof contactInfo === 'object') {
    const email = (contactInfo as Record<string, unknown>).email
    if (typeof email === 'string' && email.includes('@')) return email
  }
  return null
}

export type DispatchTransition = 'accepted' | 'in_production' | 'shipped' | 'delivered' | 'failed'

const ORDER_OF: Record<string, number> =
  { sent: 0, accepted: 1, in_production: 2, shipped: 3, delivered: 4 }
const ORDER_STATUS_FOR: Partial<Record<DispatchTransition, 'shipped' | 'completed'>> =
  { shipped: 'shipped', delivered: 'completed' }

export function applyDispatchTransition(current: string, next: DispatchTransition):
  { ok: true; orderStatus: 'processing' | 'shipped' | 'completed' | null } | { ok: false; reason: string } {
  if (next === 'failed') return { ok: true, orderStatus: null }
  if (!(current in ORDER_OF) || ORDER_OF[next] <= ORDER_OF[current])
    return { ok: false, reason: `Cannot move dispatch from '${current}' to '${next}'` }
  return { ok: true, orderStatus: ORDER_STATUS_FOR[next] ?? null }
}
```

- [ ] **Step 4: Run** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat(fulfillment): pure dispatch core — guards, CSV contract, transitions"`

### Task 9: Email templates for dispatch + ship (TDD)

**Files:**
- Modify: `lib/email/templates.ts` (append two functions; follow the exact style of `paymentCapturedEmail` at line 93 — same `EmailContent` return, same `esc()` escaping helper used by existing templates)
- Test: `tests/email/fulfillment-templates.test.ts`

**Interfaces (produced):**
- `vendorDispatchEmail(p: { shortId: string; vendorName: string; recordCount: number; mailClass: string | null; postageType: string | null; proofUrl: string; csvUrl: string }): EmailContent`
- `orderShippedEmail(p: { orderId: string; shortId: string; trackingNumber?: string | null; trackingCarrier?: string | null; appUrl: string }): EmailContent`

- [ ] **Step 1: Failing tests**

```typescript
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { vendorDispatchEmail, orderShippedEmail } from '../../lib/email/templates'

describe('fulfillment email templates', () => {
  it('vendor dispatch includes order facts and both signed links', () => {
    const c = vendorDispatchEmail({
      shortId: 'AB12CD34', vendorName: 'PrintCo', recordCount: 250,
      mailClass: 'first_class', postageType: 'stamp',
      proofUrl: 'https://x/proof', csvUrl: 'https://x/csv',
    })
    assert.ok(c.subject.includes('AB12CD34'))
    assert.ok(c.html.includes('https://x/proof'))
    assert.ok(c.html.includes('https://x/csv'))
    assert.ok(c.html.includes('250'))
  })
  it('vendor dispatch escapes HTML in vendor-controlled fields', () => {
    const c = vendorDispatchEmail({
      shortId: 'X', vendorName: '<img src=x>', recordCount: 1,
      mailClass: null, postageType: null, proofUrl: 'https://x', csvUrl: 'https://x',
    })
    assert.ok(!c.html.includes('<img src=x>'))
  })
  it('shipped email shows tracking when present, omits cleanly when absent', () => {
    const withT = orderShippedEmail({ orderId: 'id', shortId: 'S1',
      trackingNumber: '9400', trackingCarrier: 'USPS', appUrl: 'https://app' })
    assert.ok(withT.html.includes('9400'))
    assert.ok(withT.html.includes('USPS'))
    const noT = orderShippedEmail({ orderId: 'id', shortId: 'S1', appUrl: 'https://app' })
    assert.ok(!noT.html.includes('undefined'))
  })
})
```

Existing email tests live at `tests/email/invite-template.test.ts` — copy its exact import style if it differs from the above.

- [ ] **Step 2: Run → FAIL. Implement** the two templates in `templates.ts`, reusing the file's existing escape helper and layout wrapper (read the file first; match `paymentCapturedEmail`'s structure exactly — subject line, wrapper call, CTA link). Shipped email links to `${appUrl}/orders/${orderId}`.
- [ ] **Step 3: Run → PASS. Commit** — `git commit -am "feat(email): vendor dispatch + order shipped templates"`

### Task 9b: Vendor schema alignment (dispatch's prerequisite — drift found 2026-07-31)

**Files:**
- Modify: `lib/vendors/vendor-service.ts` (createVendor/list/update field mapping)
- Read first: `app/api/vendors/route.ts` (it may query its own column set — align it too)

**Why:** `VendorService.createVendor` (line 62-75) inserts `user_id, type (scalar), services, pricing_model, base_pricing, capabilities` — **none of these columns exist** on the migrated `vendors` table (`20260613000000` line 388: `name, vendor_type text[], contact_info jsonb, pricing_tiers jsonb, performance_metrics jsonb, is_active`). Vendor creation fails at runtime, and dispatch (Task 10) cannot select a vendor that can't be created. This is the same class of drift as Task 5.

**Interfaces:**
- Produces: vendors rows where `vendor_type` contains `'print'` and `is_active = true` are selectable by Task 10's vendor query. Keep the `CreateVendorRequest` public interface unchanged (UI depends on it); translate at the DB boundary.

- [ ] **Step 1: Map at the insert/update boundary** in `createVendor` (and mirror in `updateVendor`):

```typescript
const vendorData = {
  name: request.name,
  vendor_type: [request.type],                    // scalar → text[]
  contact_info: request.contact_info,
  pricing_tiers: request.base_pricing ?? null,    // closest migrated column
  performance_metrics: {},
  is_active: true,
}
```

Drop `user_id`/`services`/`capabilities`/`pricing_model` from the DB payload (vendors are global, admin-managed; if the UI displays `services`, fold it into `contact_info` jsonb as `{ ..., services }` rather than adding columns). Map reads back: `type: row.vendor_type?.[0]`, `status: row.is_active ? 'active' : 'inactive'`.

- [ ] **Step 2: Check the write path's client.** `VendorService` uses the browser client (`utils/supabase/client`) — verify the vendors table has RLS policies permitting authenticated insert/update in `20260613000000`; if RLS blocks it (likely — the migration shows no vendors policies in the audited section), route writes through `app/api/vendors/route.ts` with the service client + `withAdmin`, and make the UI call the API instead of the service directly. Read the route first; it may already do this.
- [ ] **Step 3: Manual verification** — create a print vendor via the admin/vendors UI (or curl the API), then confirm `select * from vendors where is_active and vendor_type @> array['print']` returns it.
- [ ] **Step 4: Commit** — `git commit -am "fix(vendors): align vendor CRUD to migrated schema (vendor_type[], is_active)"`

### Task 10: Dispatch service (IO layer)

**Files:**
- Create: `lib/fulfillment/dispatch-service.ts`
- Create: `lib/fulfillment/index.ts` (re-exports)

**Interfaces (produced — consumed by Tasks 11-13):**

```typescript
export async function dispatchOrder(opts: {
  orderId: string; actorId: string; vendorId?: string
}): Promise<{ dispatchId: string; vendorId: string; vendorName: string }>
export async function updateDispatchStatus(opts: {
  orderId: string; status: DispatchTransition; actorId: string
  trackingNumber?: string; trackingCarrier?: string
}): Promise<{ orderStatus: string | null }>
export async function latestDispatch(orderId: string): Promise<Record<string, unknown> | null>
```

- [ ] **Step 1: Implement `dispatchOrder`** (service client via `createServiceClient` from `@/utils/supabase/service` — same import as `lib/admin/order-service.ts`):
  1. Load order: `select('id, status, payment_status, stripe_payment_intent_id, record_count, proof_urls, metadata, mail_class, postage_type, created_by')`. Run `canDispatch` — throw the `reason` on failure.
  2. Guard against double-dispatch: if `latestDispatch(orderId)` has status other than `failed`, throw `'Order already dispatched — update its status instead'`.
  3. Resolve vendor: if `vendorId` given, load it; else `supabase.from('vendors').select('id, name, contact_info').eq('is_active', true).contains('vendor_type', ['print']).order('name').limit(1)`. No vendor → throw `'No active print vendor configured — add one in Vendors before dispatching'` (loud, owner-actionable — matches the BLOCKED-BY-OWNER seam convention).
  4. Resolve recipients: `const listData = order.metadata?.order_state?.dataAndMapping?.listData ?? order.metadata?.order_state?.listData`; if `listData.selectedListId` → `supabase.from('mailing_list_records').select('first_name, last_name, address_line_1, address_line_2, city, state, zip_code, company, email, phone').eq('mailing_list_id', selectedListId)`; else use `listData.manualRecords ?? []`. Empty → throw.
  5. `buildRecipientCsv(records)` → upload to the private proof bucket: `supabase.storage.from(PROOF_BUCKET).upload(`dispatch/${orderId}/recipients.csv`, csv, { contentType: 'text/csv', upsert: true })` (`PROOF_BUCKET` from `@/lib/orders/proof-storage`).
  6. Sign both artifacts with `signProofUrl(supabase, path, 60 * 60 * 24 * 7)` (7-day TTL — vendor turnaround); proof path from `firstProofUrl(order.proof_urls)` (import from `@/lib/orders/order-summary`; note `signProofUrl` passes through full URLs and signs bare paths).
  7. Insert `order_dispatches` row (`package: { csvPath, proofPath, recordCount: records.length }`, `created_by: actorId`).
  8. Update order: `vendor_assignments: { vendorId, dispatchId, dispatchedAt }` (jsonb).
  9. Email: `trySendEmail(vendorContactEmail(vendor.contact_info), vendorDispatchEmail({...}))`. A `null` contact email → mark the dispatch row `status: 'failed', error: 'vendor has no contact email'` and throw.
  10. `logAdminAction({ actorId, action: 'order_dispatched', targetType: 'order', targetId: orderId, newValue: { vendorId, dispatchId } })` (import from `@/lib/admin/audit-logger` — same call shape as `lib/admin/order-service.ts:95`).
- [ ] **Step 2: Implement `updateDispatchStatus`**: load latest dispatch → `applyDispatchTransition(current, next)` — throw `reason` on `ok: false`. Update dispatch row (status + the matching timestamp column: accepted_at/shipped_at/delivered_at + tracking fields + `updated_at`). If `orderStatus` non-null, update `orders.status`. On `shipped`: load customer email via `getUserEmail(order.created_by)` (from `@/lib/orders/generate-proof`, as used in the approve route) and `trySendEmail(email, orderShippedEmail({...}))`. Audit-log `order_dispatch_status_changed`.
- [ ] **Step 3: `latestDispatch`**: newest `order_dispatches` row for the order or null.
- [ ] **Step 4: Gates** — `npm test` (existing suite must stay green), `typecheck:full` 0.
- [ ] **Step 5: Commit** — `git commit -am "feat(fulfillment): dispatch service — vendor select, package build, email, transitions"`
- [ ] **Step 6: Phase checkpoint** — roadmap update, then `/git-workflow-planning:checkpoint 2 "dispatch core + schema"`

---

## Phase 3 — API routes + auto-dispatch hook

### Task 11: Admin dispatch API

**Files:**
- Create: `app/api/admin/orders/[orderId]/dispatch/route.ts`

**Interfaces:**
- Consumes: Task 10 service. Produces: `POST` body `{ vendorId?: string }` → `{ dispatchId, vendorId, vendorName }`; `PATCH` body `{ status: 'accepted'|'in_production'|'shipped'|'delivered'|'failed', trackingNumber?, trackingCarrier? }` → `{ orderStatus }`; `GET` → `{ dispatch }` (latest row or null). All `withAdmin`.

- [ ] **Step 1: Implement** (mirror the structure of `app/api/admin/orders/[orderId]/payment/route.ts` exactly — same `withAdmin` import, same orderId extraction `new URL(request.url).pathname.split('/').at(-2)!`, same Zod-parse-then-400 shape):

```typescript
const dispatchSchema = z.object({ vendorId: z.string().uuid().optional() })
const statusSchema = z.object({
  status: z.enum(['accepted', 'in_production', 'shipped', 'delivered', 'failed']),
  trackingNumber: z.string().max(100).optional(),
  trackingCarrier: z.string().max(50).optional(),
})
```

POST → `dispatchOrder({ orderId, actorId: admin.userId, vendorId })`; PATCH → `updateDispatchStatus(...)`; GET → `latestDispatch(orderId)`. Service errors → 409 with the thrown message (they are all user-actionable guard messages), unexpected → 500.

- [ ] **Step 2: Gates + commit** — `git commit -am "feat(admin): dispatch API — create, transition, read"`

### Task 12: Auto-dispatch after capture

**Files:**
- Modify: `app/api/orders/[orderId]/approve/route.ts` (insert after the `paymentCapturedEmail` send, before the final `return NextResponse.json({ status: 'processing' })` at line ~123)

**Interfaces:** consumes `dispatchOrder`.

- [ ] **Step 1: Add the hook**

```typescript
// Fire-and-forget fulfillment hand-off: a dispatch failure must never fail
// the customer's approval (payment already captured) — admins re-dispatch
// from the order detail page.
try {
  const { dispatchOrder } = await import('@/lib/fulfillment/dispatch-service')
  await dispatchOrder({ orderId, actorId: userId })
} catch (dispatchErr) {
  console.error(`Auto-dispatch failed for order ${orderId} (admin action required):`, dispatchErr)
}
```

- [ ] **Step 2: Gates + commit** — `git commit -am "feat(orders): auto-dispatch to print vendor after proof-approval capture"`

### Task 13: Customer status API exposes tracking

**Files:**
- Modify: `app/api/orders/[orderId]/route.ts` (order detail GET)
- Modify: `lib/orders/order-summary.ts` (add optional fields)
- Test: extend `tests/lib/orders/order-summary.test.ts`

**Interfaces:**
- `OrderSummary` gains `trackingNumber: string | null` and `trackingCarrier: string | null`; `summarizeOrderRow(row, tracking?)` accepts an optional `{ tracking_number?: string | null; tracking_carrier?: string | null }` second arg defaulting to nulls. (Additive — existing callers unchanged.)

- [ ] **Step 1: Failing test** — `summarizeOrderRow(row, { tracking_number: '9400', tracking_carrier: 'USPS' })` exposes both; omitted arg yields nulls. (Extend the existing suite in `tests/lib/orders/order-summary.test.ts` — mocha + `strict as assert` + relative import, matching its current header exactly.)
- [ ] **Step 2: Implement** the two summary fields; in the detail route, after loading the order call `latestDispatch(orderId)` and pass `{ tracking_number, tracking_carrier }` through when the dispatch is shipped/delivered.
- [ ] **Step 3: Gates + commit**, then **Phase checkpoint** — roadmap update + `/git-workflow-planning:checkpoint 3 "dispatch API + auto-hook + tracking"`

---

## Phase 4 — Admin UI + verification

### Task 14: Dispatch panel on admin order detail

**Files:**
- Create: `components/admin/orders/dispatch-panel.tsx`
- Modify: `app/dashboard/admin/orders/[orderId]/page.tsx` (render the panel; read the page first and slot the panel beside the existing payment-actions component in `components/admin/orders/`)

**Interfaces:** consumes Task 11 endpoints via `fetch`.

- [ ] **Step 1: Build `DispatchPanel({ orderId }: { orderId: string })`** — client component, deliberately plain shadcn (Masthead re-skins later):
  - On mount `GET /api/admin/orders/${orderId}/dispatch` → show either "Not dispatched" + vendor `<Select>` (options from `GET /api/vendors`, filter client-side to `vendor_type` containing `'print'` and `is_active`) + **Dispatch** button, or the dispatch card: vendor name, status badge, timestamps, tracking.
  - Status advance buttons appear per state: sent→Accepted, accepted→In production, in_production→**Mark shipped** (opens tracking number + carrier inputs, both optional), shipped→Delivered. Each `PATCH`es and refetches. Failure → `sonner` toast with the server message.
  - Follow the fetch/error/toast idioms already used in `components/admin/orders/` (read the existing payment-actions component and copy its patterns — auth headers, toast usage).
- [ ] **Step 2: Manual browser verification** (chrome-devtools MCP, existing dev server on :3010): admin → order in `processing` → dispatch → status advances → customer status page shows "Mailed" + tracking. Use the seeded e2e user (`docs/temp/production-blockers.md` B7 notes).
- [ ] **Step 3: Commit** — `git commit -am "feat(admin): dispatch panel — vendor select, dispatch, status advance with tracking"`

### Task 15: End-to-end verification + docs

**Files:**
- Modify: `dev-docs/implementation-status.md` (§3 add fulfillment; §4 remove rows 1-3; §5 remove vendor routing line)
- Modify: `ylsbrain/knowledge/features.md`, `ylsbrain/knowledge/roadmap.md`

- [ ] **Step 1: Full-loop smoke** (chrome-devtools, local stack): place a test order through the wizard (Stripe test card) → approve proof → confirm auto-dispatch row exists + vendor email attempt logged → admin advances to shipped w/ tracking → customer timeline shows Mailed → Delivered completes the order. Verify admin analytics revenue is non-zero (Phase 1 payoff) and admin order detail shows the inline payment row.
- [ ] **Step 2: Gate sweep** — `npm test` green, `npm run typecheck:full` 0, `npm run lint` no new problems, `npm run build` exit 0.
- [ ] **Step 3: Update the three status docs** (flip fulfillment to BUILT with evidence paths; move the payment_transactions/drift rows out of PARTIAL).
- [ ] **Step 4: Checkpoint + finish** — `/git-workflow-planning:checkpoint 4 "admin dispatch UI + e2e verified"`, then `/git-workflow-planning:finish` (PR → develop).

---

## Out of scope (explicitly deferred)

- Inbound vendor webhook / email parsing (vendor replies stay manual status clicks) — future task, pairs with D10.
- D9 vendor-gated capture (moves capture from customer approval to vendor confirmation) — builds directly on `order_dispatches`; separate plan once vendors return proofs into the system.
- Multi-vendor routing rules (by product type/geography/price) — v1 is single active print vendor or explicit admin choice.
- Retry queue for dispatch emails (`trySendEmail` is best-effort; failed dispatch is visible in the panel and re-dispatchable).

## Self-review notes

- Every `payment_transactions` reference site (6 files) is covered: analytics-service (T3), payment-intent-service (T4), order-service (T5), user-service + capture/refund routes (T6).
- Money units audited: T2 tests pin dollars-no-division; T4 divides by 100 only at the Stripe boundary.
- `cancelled` enum value (T1) lands before T5 writes it in `refundOrder` — order preserved.
- Type consistency: `DispatchTransition`, `canDispatch`, CSV contract defined once in T8 and imported everywhere; `signProofUrl`/`PROOF_BUCKET`/`firstProofUrl`/`getUserEmail`/`logAdminAction`/`trySendEmail` all verified-existing exports with paths cited.

## Pre-lock verification pass (2026-07-31) — assumptions checked against code

| Assumption | Result |
|---|---|
| Test style: chai + `@/` aliases | **WRONG — corrected.** House style is mocha + node `strict assert` + relative imports (all snippets updated) |
| capture/refund routes need `withAdmin` | **Superseded.** Zero callers exist → T6 archives them instead (attack-surface removal) |
| `VendorService` writes match the vendors table | **WRONG — new drift found.** Service inserts nonexistent columns; added Task 9b (vendor schema alignment) as dispatch prerequisite |
| `contact_info.email` exists | Confirmed (`vendor-service.ts:9-10`, optional) — `vendorContactEmail` null-guard is required, not defensive |
| `selectedListId` covers uploaded lists too | Confirmed — `ColumnMappingStep.tsx:38` sets `selectedListId: result.mailingListId` after upload persist |
| `getUserEmail`, `signProofUrl`, `PROOF_BUCKET`, `firstProofUrl`, `logAdminAction`, `trySendEmail` signatures | Confirmed by direct read this session |
| `ALTER TYPE ... ADD VALUE` inside a migration transaction | Valid on PG12+ provided the value isn't used in the same migration (it isn't) — stable knowledge, worth a local `supabase migration up` check first (T1 Step 2 does this) |
