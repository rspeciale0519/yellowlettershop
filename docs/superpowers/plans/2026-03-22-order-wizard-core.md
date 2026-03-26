# Order Wizard E2E — Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the YLS order wizard fully compilable, navigable, and interactive — restore the missing types file, wire navigation, fix validation, create 4 missing API routes, build `ManualEntryForm`, and replace mock AccuZip validation with real API polling.

**Architecture:** Sequential foundation-first: restore `types/orders.ts` (unblocks compilation), wire navigation stubs, fix the validation switch, add database tables, create the 4 missing API routes, build the `ManualEntryForm` component for Step 1 manual data entry, and replace the mock AccuZip handler with real upload/poll/results flow. MLM integration (MlmListPicker, `user_integrations` table, 6 MLM routes, settings UI) is a separate follow-on plan (`2026-03-22-order-wizard-mlm.md`).

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase service client, Zod (API + form validation), ShadCN/UI, sonner (toasts), swr, Mocha + RTL (tests), Supabase CLI (migrations)

**Spec:** `docs/superpowers/specs/2026-03-22-order-wizard-e2e-design.md` (Sections 1, 2.2, 3)

---

## File Map

### Created
| File | Responsibility |
|------|----------------|
| `types/orders.ts` | All order wizard types — restored from backup, no edits |
| `lib/orders/pricing.ts` | Pure pricing calculation (extracted from calculate-pricing route) |
| `app/api/orders/drafts/route.ts` | POST upsert draft |
| `app/api/orders/drafts/[id]/route.ts` | GET load draft by ID |
| `app/api/orders/pricing/route.ts` | POST pricing from OrderState via shared lib |
| `app/api/orders/submit/route.ts` | POST submit completed order |
| `supabase/migrations/20260322000000_order_tables.sql` | order_drafts + orders tables with RLS |
| `components/orders/steps/ManualEntryForm.tsx` | Manual recipient entry form for Step 1 |
| `components/orders/steps/UndeliverablePanel.tsx` | Collapsible undeliverable addresses table |
| `tests/lib/orders/pricing.test.ts` | Unit tests for pricing calculation |
| `data/us-states.ts` | US state abbreviation list for State dropdown |

### Modified
| File | Change |
|------|--------|
| `app/orders/new/page.tsx` | Wire `nextStep`, `previousStep`, `saveDraft` into `commonProps` |
| `components/orders/OrderProvider.tsx` | Remove 8 legacy `validateCurrentStep` case branches |
| `components/orders/steps/DataSourceDetailsSection.tsx` | Render `ManualEntryForm` in `'manual'` branch; add `onDataComplete` prop |
| `components/orders/steps/DataAndMappingStep.tsx` | Pass `onDataComplete` to `DataSourceDetailsSection` |
| `components/orders/steps/AddressValidationStep.tsx` | Replace mock with real AccuZip upload/poll/results flow |
| `app/api/orders/calculate-pricing/route.ts` | Import calculation from `lib/orders/pricing` |

---

## Task 1: Create database migration

**Files:**
- Create: `supabase/migrations/20260322000000_order_tables.sql`

- [ ] **Step 1: Write migration file**

```sql
-- order_drafts: persists wizard state between sessions (30-day expiry)
create table if not exists order_drafts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  order_state jsonb not null,
  status      text not null default 'active'
                check (status in ('active', 'submitted')),
  expires_at  timestamptz not null default (now() + interval '30 days'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists order_drafts_user_id_idx on order_drafts(user_id, status);

alter table order_drafts enable row level security;
create policy "users manage own drafts"
  on order_drafts for all
  using (auth.uid() = user_id);

-- orders: submitted orders (minimal schema — full lifecycle is a separate spec)
create table if not exists orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  draft_id     uuid references order_drafts(id),
  order_state  jsonb not null,
  status       text not null default 'submitted'
                 check (status in ('submitted', 'processing', 'completed', 'cancelled')),
  submitted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders(user_id, status);

alter table orders enable row level security;
create policy "users view own orders"
  on orders for all
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

```bash
cd C:/Users/rob/documents/software/service-businesses/yls
npx supabase db push
```

If Supabase CLI is not linked, run the SQL directly in the Supabase Dashboard → SQL Editor.

Expected: tables `order_drafts` and `orders` appear in Supabase → Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260322000000_order_tables.sql
git commit -m "feat: add order_drafts and orders database tables"
```

---

## Task 2: Restore `types/orders.ts`

**Files:**
- Create: `types/orders.ts`

- [ ] **Step 1: Copy from backup — no edits**

```bash
cp temp/versions/new-001-bkup-01/types/orders.ts types/orders.ts
```

- [ ] **Step 2: Verify the import error is gone**

```bash
npx tsc --noEmit 2>&1 | grep "Cannot find module.*types/orders"
```

Expected: no output (the error is gone). Other TS errors may still exist — that's fine.

- [ ] **Step 3: Commit**

```bash
git add types/orders.ts
git commit -m "feat: restore types/orders.ts from backup"
```

---

## Task 3: Wire navigation callbacks in `app/orders/new/page.tsx`

**Files:**
- Modify: `app/orders/new/page.tsx` (~line 202)

- [ ] **Step 1: Extend the `useOrderWorkflow()` destructure in `OrderContent`**

```tsx
// Before (around line 202):
const { updateOrderState, validateCurrentStep } = useOrderWorkflow()

// After:
const { updateOrderState, validateCurrentStep, nextStep, previousStep, saveDraft } = useOrderWorkflow()
```

- [ ] **Step 2: Replace stub callbacks in `commonProps`**

```tsx
// Before (around line 208-215):
const commonProps = {
  orderState,
  onUpdateState: updateOrderState,
  onNext: () => {},
  onBack: () => {},
  onSaveDraft: () => {},
  validation: validateCurrentStep()
}

// After:
const commonProps = {
  orderState,
  onUpdateState: updateOrderState,
  onNext: nextStep,
  onBack: previousStep,
  onSaveDraft: saveDraft,
  validation: validateCurrentStep()
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "orders/new/page"
```

Expected: no errors for this file.

- [ ] **Step 4: Commit**

```bash
git add app/orders/new/page.tsx
git commit -m "fix: wire navigation callbacks in order wizard"
```

---

## Task 4: Fix `validateCurrentStep()` in `OrderProvider.tsx`

**Files:**
- Modify: `components/orders/OrderProvider.tsx`

- [ ] **Step 1: Find the switch statement**

Search for `validateCurrentStep` in `components/orders/OrderProvider.tsx`. Locate the `switch` that dispatches on step key.

- [ ] **Step 2: Delete all 8 legacy case branches**

Remove only these case blocks entirely — do NOT touch the body of any surviving case:

```
case 'list_data': ...
case 'column_mapping': ...
case 'accuzip_validation': ...
case 'review_and_approval': ...
case 'contact_cards': ...
case 'design': ...
case 'mailing_options': ...
case 'campaign_setup': ...
```

The surviving switch must have exactly 6 cases:
`data_and_mapping`, `address_validation`, `design_and_content`, `campaign_settings`, `review`, `payment`

**Critical:** Do NOT modify the body of the `address_validation` case. It currently checks `orderState.accuzipValidation` — this is intentional and kept working by the dual-write in Task 11.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "OrderProvider"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/orders/OrderProvider.tsx
git commit -m "fix: remove legacy validateCurrentStep case branches"
```

---

## Task 5: Extract shared pricing utility + write tests

**Files:**
- Create: `lib/orders/pricing.ts`
- Create: `tests/lib/orders/pricing.test.ts`
- Modify: `app/api/orders/calculate-pricing/route.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/orders/pricing.test.ts`:

```typescript
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { calculatePricing } from '../../../lib/orders/pricing'

describe('calculatePricing', () => {
  it('calculates base postcard with no postage', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      100
    )
    assert.equal(result.printing, 4.50)       // 100 * $0.045
    assert.equal(result.postage, null)
    assert.equal(result.total, 4.50)
    assert.equal(result.recordCount, 100)
  })

  it('includes postage when includePostage is true', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_forever' },
      100
    )
    assert.equal(result.postage, 7.30)        // 100 * $0.073
    assert.equal(result.total, 11.80)
  })

  it('applies 5% volume discount at 1000+ records', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt', finish: 'matte' },
      1000
    )
    // printing = 45000 cents, discount = floor(45000 * 0.05) = 2250 cents = $22.50
    assert.equal(result.discount, 22.50)
    assert.equal(result.total, 45.00 - 22.50)
  })

  it('falls back to first_class_forever when discounted rate requested under 200 records', () => {
    const result = calculatePricing(
      { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6', paperStock: 'standard_14pt',
        finish: 'matte', includePostage: true, postageType: 'first_class_discounted' },
      100
    )
    assert.equal(result.postage, 7.30)        // fell back to first_class_forever rate
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --grep "calculatePricing" 2>&1 | tail -15
```

Expected: FAIL — `Cannot find module '../../../lib/orders/pricing'`

- [ ] **Step 3: Create `lib/orders/pricing.ts`**

```typescript
const PRICING = {
  printing: {
    postcard_4x6: 45,
    postcard_5x7: 65,
    letter_8_5x11: 75,
    letter_folded: 95
  },
  paperStock: {
    standard_14pt: 0,
    premium_16pt: 5,
    luxury_18pt: 10
  },
  finish: {
    matte: 0,
    gloss: 2,
    uv_coating: 5
  },
  postage: {
    first_class_forever: 73,
    first_class_discounted: 60,
    standard: 25
  },
  shipping: {
    ship_processed: { base: 1500, perPiece: 2 },
    full_service: { base: 0, perPiece: 0 }
  },
  volumeDiscounts: [
    { minQuantity: 5000, discount: 0.10 },
    { minQuantity: 2500, discount: 0.07 },
    { minQuantity: 1000, discount: 0.05 },
    { minQuantity: 500,  discount: 0.03 }
  ]
} as const

export type MailingOptions = {
  serviceLevel: 'full_service' | 'ship_processed' | 'print_only'
  mailPieceFormat?: keyof typeof PRICING.printing
  paperStock?: keyof typeof PRICING.paperStock
  finish?: keyof typeof PRICING.finish
  postageType?: keyof typeof PRICING.postage
  includePostage?: boolean
}

export type PricingResult = {
  printing: number
  postage: number | null
  shipping: number | null
  discount: number | null
  total: number
  recordCount: number
  pricePerPiece: number
  breakdown: {
    printingDetails: {
      baseFormat: string | undefined
      baseCost: number
      paperUpcharge: number
      finishUpcharge: number
    }
    volumeDiscount: { tier: number; percentage: number } | null
  }
}

export function calculatePricing(opts: MailingOptions, recordCount: number): PricingResult {
  let totalCents = 0
  let printingCents = 0
  let postageCents = 0
  let shippingCents = 0
  let discountCents = 0

  if (opts.serviceLevel !== 'print_only') {
    const formatCost = PRICING.printing[opts.mailPieceFormat ?? 'postcard_4x6']
    const paperCost  = PRICING.paperStock[opts.paperStock ?? 'standard_14pt']
    const finishCost = PRICING.finish[opts.finish ?? 'matte']
    printingCents = (formatCost + paperCost + finishCost) * recordCount
  } else {
    printingCents = 2500
  }
  totalCents += printingCents

  if (opts.serviceLevel === 'full_service' && opts.includePostage && opts.postageType) {
    let rate = PRICING.postage[opts.postageType]
    if ((opts.postageType === 'first_class_discounted' || opts.postageType === 'standard') && recordCount < 200) {
      rate = PRICING.postage.first_class_forever
    }
    postageCents = rate * recordCount
    totalCents += postageCents
  }

  if (opts.serviceLevel === 'ship_processed') {
    const s = PRICING.shipping.ship_processed
    shippingCents = s.base + s.perPiece * recordCount
    totalCents += shippingCents
  }

  const tier = PRICING.volumeDiscounts.find(t => recordCount >= t.minQuantity)
  if (tier && printingCents > 0) {
    discountCents = Math.floor(printingCents * tier.discount)
    totalCents -= discountCents
  }

  return {
    printing:      printingCents  / 100,
    postage:       postageCents   > 0 ? postageCents   / 100 : null,
    shipping:      shippingCents  > 0 ? shippingCents  / 100 : null,
    discount:      discountCents  > 0 ? discountCents  / 100 : null,
    total:         totalCents     / 100,
    recordCount,
    pricePerPiece: totalCents / recordCount / 100,
    breakdown: {
      printingDetails: {
        baseFormat:    opts.mailPieceFormat,
        baseCost:      PRICING.printing[opts.mailPieceFormat ?? 'postcard_4x6']  / 100,
        paperUpcharge: PRICING.paperStock[opts.paperStock ?? 'standard_14pt']    / 100,
        finishUpcharge:PRICING.finish[opts.finish ?? 'matte']                    / 100
      },
      volumeDiscount: tier ? { tier: tier.minQuantity, percentage: tier.discount * 100 } : null
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --grep "calculatePricing" 2>&1 | tail -15
```

Expected: 4 passing

- [ ] **Step 5: Update `calculate-pricing/route.ts` to use shared utility**

In `app/api/orders/calculate-pricing/route.ts`:

1. Add import at the top:
```typescript
import { calculatePricing } from '@/lib/orders/pricing'
```

2. Replace the entire POST handler body (the calculation block) with:
```typescript
const result = calculatePricing(mailingOptions as any, recordCount)
return NextResponse.json(result)
```

3. Delete the `PRICING` constant, the `calculateExample` function, and the GET handler's example calculations — they're unused.

- [ ] **Step 6: Verify TypeScript and tests**

```bash
npx tsc --noEmit 2>&1 | grep -E "(pricing|calculate)"
npm test -- --grep "calculatePricing"
```

Expected: no TS errors, 4 tests passing.

- [ ] **Step 7: Commit**

```bash
git add lib/orders/pricing.ts tests/lib/orders/pricing.test.ts app/api/orders/calculate-pricing/route.ts
git commit -m "feat: extract pricing calculation to shared utility with tests"
```

---

## Task 6: Create `POST /api/orders/drafts`

**Files:**
- Create: `app/api/orders/drafts/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const SaveDraftSchema = z.object({
  orderId:    z.string().uuid().optional(),
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const body = await req.json()
    const { orderId, orderState } = SaveDraftSchema.parse(body)
    const supabase = createClient()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    if (orderId) {
      // Verify ownership before updating
      const { data: existing } = await supabase
        .from('order_drafts')
        .select('id')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      await supabase
        .from('order_drafts')
        .update({ order_state: orderState, expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      return NextResponse.json({ orderId })
    }

    const { data, error } = await supabase
      .from('order_drafts')
      .insert({ user_id: userId, order_state: orderState, expires_at: expiresAt })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ orderId: data.id })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Save draft error:', err)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
})
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "orders/drafts/route"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/drafts/route.ts
git commit -m "feat: add POST /api/orders/drafts route"
```

---

## Task 7: Create `GET /api/orders/drafts/[id]`

**Files:**
- Create: `app/api/orders/drafts/[id]/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

interface RouteParams { params: { id: string } }

export const GET = withAuth(async (
  req: NextRequest,
  { userId }: { userId: string },
  { params }: RouteParams
) => {
  try {
    const { id } = params
    const supabase = createClient()

    const { data, error } = await supabase
      .from('order_drafts')
      .select('id, order_state, expires_at')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Draft expired' }, { status: 404 })
    }

    return NextResponse.json({ orderState: data.order_state })

  } catch (err) {
    console.error('Load draft error:', err)
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
  }
})
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "drafts/\[id\]"
```

- [ ] **Step 3: Commit**

```bash
git add "app/api/orders/drafts/[id]/route.ts"
git commit -m "feat: add GET /api/orders/drafts/[id] route"
```

---

## Task 8: Create `POST /api/orders/pricing`

**Files:**
- Create: `app/api/orders/pricing/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { calculatePricing } from '@/lib/orders/pricing'

const PricingFromStateSchema = z.object({
  orderState: z.object({
    // accept both canonical and legacy field locations
    mailingOptions: z.object({
      serviceLevel: z.enum(['full_service', 'ship_processed', 'print_only']),
      mailPieceFormat: z.string().optional(),
      paperStock: z.string().optional(),
      finish: z.string().optional(),
      postageType: z.string().optional(),
      includePostage: z.boolean().optional()
    }).optional(),
    campaignSettings: z.object({
      mailingOptions: z.record(z.unknown()).optional()
    }).optional(),
    listData: z.object({
      totalRecords: z.number().optional(),
      manualRecords: z.array(z.unknown()).optional()
    }).optional(),
    dataAndMapping: z.object({
      listData: z.object({
        totalRecords: z.number().optional(),
        manualRecords: z.array(z.unknown()).optional()
      }).optional()
    }).optional()
  })
})

export const POST = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const body = await req.json()
    const { orderState } = PricingFromStateSchema.parse(body)

    const mailingOptions = (orderState.mailingOptions ?? orderState.campaignSettings?.mailingOptions) as any

    if (!mailingOptions?.serviceLevel) {
      return NextResponse.json({ error: 'Mailing options not configured' }, { status: 400 })
    }

    const listData = orderState.dataAndMapping?.listData ?? orderState.listData
    const recordCount = listData?.totalRecords ?? listData?.manualRecords?.length ?? 0

    if (recordCount < 1) {
      return NextResponse.json({ error: 'Record count must be at least 1' }, { status: 400 })
    }

    return NextResponse.json(calculatePricing(mailingOptions, recordCount))

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Pricing error:', err)
    return NextResponse.json({ error: 'Pricing calculation failed' }, { status: 500 })
  }
})
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "orders/pricing"
```

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/pricing/route.ts
git commit -m "feat: add POST /api/orders/pricing route"
```

---

## Task 9: Create `POST /api/orders/submit`

**Files:**
- Create: `app/api/orders/submit/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { createClient } from '@/utils/supabase/service'

const SubmitOrderSchema = z.object({
  orderState: z.record(z.unknown())
})

export const POST = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const body = await req.json()
    const { orderState } = SubmitOrderSchema.parse(body)

    const payment = (orderState as any).payment
    if (payment?.status !== 'authorized') {
      return NextResponse.json(
        { error: 'Payment must be authorized before submitting' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_id: userId, order_state: orderState })
      .select('id')
      .single()

    if (orderError) throw orderError

    // Mark associated draft as submitted
    const draftId = (orderState as any).orderId
    if (draftId) {
      await supabase
        .from('order_drafts')
        .update({ status: 'submitted' })
        .eq('id', draftId)
        .eq('user_id', userId)
    }

    return NextResponse.json({ orderId: order.id, status: 'submitted' })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    console.error('Submit order error:', err)
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
})
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "submit/route"
```

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/submit/route.ts
git commit -m "feat: add POST /api/orders/submit route"
```

---

## Task 10: Create `ManualEntryForm.tsx` and wire into Step 1

**Files:**
- Create: `data/us-states.ts`
- Create: `components/orders/steps/ManualEntryForm.tsx`
- Modify: `components/orders/steps/DataSourceDetailsSection.tsx`
- Modify: `components/orders/steps/DataAndMappingStep.tsx`

- [ ] **Step 1: Check if `data/us-states.ts` already exists**

```bash
ls data/ 2>/dev/null
```

If not present, create it:

```typescript
// data/us-states.ts
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },    { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },    { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },{ value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },    { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },     { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },   { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },       { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },   { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },      { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },{ value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },   { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },   { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },{ value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },{ value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },       { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },     { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },{ value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },{ value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },      { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },    { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },  { value: 'WY', label: 'Wyoming' }
]
```

- [ ] **Step 2: Create `ManualEntryForm.tsx`**

Uses controlled state + Zod.safeParse (no react-hook-form — not installed).

```tsx
'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle } from 'lucide-react'
import { US_STATES } from '@/data/us-states'

const RecipientSchema = z.object({
  firstName:   z.string().min(1, 'Required'),
  lastName:    z.string().min(1, 'Required'),
  addressLine1:z.string().min(1, 'Required'),
  addressLine2:z.string().optional(),
  city:        z.string().min(1, 'Required'),
  state:       z.string().min(2, 'Required'),
  zipCode:     z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP (e.g. 12345)')
})

export type ManualRecord = z.infer<typeof RecipientSchema>

const EMPTY: ManualRecord = {
  firstName: '', lastName: '', addressLine1: '', addressLine2: '',
  city: '', state: '', zipCode: ''
}

interface ManualEntryFormProps {
  records: ManualRecord[]
  onRecordsChange: (records: ManualRecord[]) => void
}

export function ManualEntryForm({ records, onRecordsChange }: ManualEntryFormProps) {
  const [fields, setFields] = useState<ManualRecord>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ManualRecord, string>>>({})

  const set = (key: keyof ManualRecord, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleAdd = () => {
    const result = RecipientSchema.safeParse(fields)
    if (!result.success) {
      const map: typeof errors = {}
      result.error.errors.forEach(e => { map[e.path[0] as keyof ManualRecord] = e.message })
      setErrors(map)
      return
    }
    onRecordsChange([...records, result.data])
    setFields(EMPTY)
    setErrors({})
  }

  const handleRemove = (idx: number) =>
    onRecordsChange(records.filter((_, i) => i !== idx))

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" value={fields.firstName} onChange={e => set('firstName', e.target.value)} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" value={fields.lastName} onChange={e => set('lastName', e.target.value)} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input id="addressLine1" value={fields.addressLine1} onChange={e => set('addressLine1', e.target.value)} />
          {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input id="addressLine2" value={fields.addressLine2} onChange={e => set('addressLine2', e.target.value)}
            placeholder="Apt, Suite, Unit (optional)" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="city">City *</Label>
            <Input id="city" value={fields.city} onChange={e => set('city', e.target.value)} />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1">
            <Label>State *</Label>
            <Select value={fields.state} onValueChange={v => set('state', v)}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input id="zipCode" value={fields.zipCode} onChange={e => set('zipCode', e.target.value)}
              placeholder="12345" />
            {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
          </div>
        </div>

        <Button type="button" onClick={handleAdd} className="w-full">
          Add Recipient
        </Button>
      </div>

      {records.length >= 20 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            For large lists, uploading a CSV is faster.
          </AlertDescription>
        </Alert>
      )}

      {records.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.firstName} {r.lastName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.addressLine1}, {r.city}, {r.state} {r.zipCode}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update `DataSourceDetailsSection.tsx`**

  a. Add `onDataComplete` to the props interface:
  ```tsx
  interface DataSourceDetailsSectionProps {
    activeTab: string
    onTabChange: (tab: string) => void
    hasListData: boolean
    orderState: OrderState
    onFileUpload?: (file: File) => void
    onDataComplete?: (listData: any) => void   // ← add this
  }
  ```

  b. Destructure it in the function signature:
  ```tsx
  export function DataSourceDetailsSection({
    activeTab, onTabChange, hasListData, orderState, onFileUpload, onDataComplete
  }: DataSourceDetailsSectionProps) {
  ```

  c. Import `ManualEntryForm`:
  ```tsx
  import { ManualEntryForm } from './ManualEntryForm'
  ```

  d. Replace the `currentSource === 'manual'` branch (around line 183) with:
  ```tsx
  {currentSource === 'manual' && (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Enter Recipients Manually</h4>
      <ManualEntryForm
        records={
          orderState.dataAndMapping?.listData?.manualRecords ??
          orderState.listData?.manualRecords ??
          []
        }
        onRecordsChange={(records) => {
          onDataComplete?.({
            source: 'manual',
            useMailingData: true,
            dataSource: 'manual_entry',
            manualRecords: records,
            totalRecords: records.length
          })
        }}
      />
    </div>
  )}
  ```

- [ ] **Step 4: Update `DataAndMappingStep.tsx` to pass `onDataComplete` to `DataSourceDetailsSection`**

In `DataAndMappingStep.tsx`, find the `<DataSourceDetailsSection ...>` render (around line 126). Add the `onDataComplete` prop:

```tsx
<DataSourceDetailsSection
  activeTab={activeTab === 'data' ? 'select-data-source' : 'map-columns'}
  onTabChange={(tab) => setActiveTab(tab === 'select-data-source' ? 'data' : 'mapping')}
  hasListData={hasListData}
  orderState={orderState}
  onFileUpload={handleFileUpload}
  onDataComplete={handleDataComplete}   // ← add this
/>
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -E "(ManualEntry|DataSourceDetails|DataAndMapping)"
```

Expected: no errors.

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

Go to `http://localhost:3000/orders/new`. Click "Manual Entry". Verify:
- Form renders with all fields (First Name, Last Name, Address, City, State dropdown, ZIP)
- Clicking "Add Recipient" with empty fields shows inline validation messages
- Adding a valid recipient shows it in the table
- Remove button works
- Adding 20+ recipients shows the "For large lists..." warning

- [ ] **Step 7: Commit**

```bash
git add components/orders/steps/ManualEntryForm.tsx components/orders/steps/DataSourceDetailsSection.tsx \
        components/orders/steps/DataAndMappingStep.tsx data/us-states.ts
git commit -m "feat: add ManualEntryForm to order wizard step 1"
```

---

## Task 11: Replace mock AccuZip with real polling

**Files:**
- Modify: `components/orders/steps/AddressValidationStep.tsx`
- Create: `components/orders/steps/UndeliverablePanel.tsx` (if file exceeds 350 LOC after changes)

- [ ] **Step 1: Read the current file**

Open `components/orders/steps/AddressValidationStep.tsx`. Find:
- `handleStartValidation` (the function that currently sets mock data)
- The progress bar / results rendering area
- The "Start Address Validation" button

- [ ] **Step 2: Add polling state variables**

At the top of the component function body, add:

```tsx
const [isValidating, setIsValidating] = useState(false)
const [validationError, setValidationError] = useState<string | null>(null)
const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }
}, [])
```

Add `useRef` to imports if not already present.

- [ ] **Step 3: Replace `handleStartValidation` entirely**

```tsx
const handleStartValidation = async () => {
  setIsValidating(true)
  setValidationError(null)

  try {
    const listData = orderState.dataAndMapping?.listData ?? orderState.listData
    const columnMapping = orderState.dataAndMapping?.columnMapping ?? orderState.columnMapping

    // Build AccuZip upload body based on data source
    let uploadListData: Record<string, unknown>
    const source = listData?.source
    const dataSource = listData?.dataSource

    if (source === 'upload' || dataSource === 'file_upload') {
      uploadListData = { source: 'upload', uploadedFileId: listData?.uploadedFileId }
    } else if (source === 'manual' || dataSource === 'manual_entry') {
      uploadListData = {
        source: 'list_builder',
        records: (listData?.manualRecords ?? []).map((r: any) => ({
          address_line_1: r.addressLine1,
          city: r.city,
          state: r.state,
          zip: r.zipCode,
          first_name: r.firstName,
          last_name: r.lastName
        }))
      }
    } else {
      // mlm_select — inline records stored by MlmListPicker (follow-on plan)
      uploadListData = { source: 'list_builder', records: listData?.mlmRecords ?? [] }
    }

    const uploadRes = await fetch('/api/accuzip/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnMapping, listData: uploadListData })
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.json()
      throw new Error(err.error ?? 'Upload failed')
    }

    const { jobId } = await uploadRes.json()

    // 5-minute hard timeout
    timeoutRef.current = setTimeout(() => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      setIsValidating(false)
      setValidationError('Validation timed out after 5 minutes. Please try again.')
    }, 5 * 60 * 1000)

    // Poll every 3 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/accuzip/status/${jobId}`)
        if (!statusRes.ok) return
        const status = await statusRes.json()

        if (status.status === 'completed') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)

          const resultsRes = await fetch(`/api/accuzip/results/${jobId}`)
          if (!resultsRes.ok) {
            setValidationError('Failed to fetch validation results. Please retry.')
            setIsValidating(false)
            return
          }

          const results = await resultsRes.json()

          // Dual-write: new field + legacy field (keeps validateCurrentStep gate working)
          onUpdateState({
            addressValidation: {
              totalRecords:      results.totalRecords,
              deliverableCount:  results.deliverableRecords,
              undeliverableCount:results.undeliverableRecords,
              deliveryRate:      results.summary?.deliveryRate,
              validatedRecords:  results.records,
              validatedAt:       results.validatedAt,
              cassCertified:     results.cassCertified
            },
            accuzipValidation: {
              totalRecords:      results.totalRecords,
              deliverableCount:  results.deliverableRecords,
              undeliverableCount:results.undeliverableRecords,
              deliveryRate:      results.summary?.deliveryRate
            }
          })

          setIsValidating(false)

        } else if (status.status === 'error') {
          if (pollingRef.current) clearInterval(pollingRef.current)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setValidationError(status.error ?? 'Validation failed. Please retry.')
          setIsValidating(false)
        }
      } catch {
        // ignore transient polling errors; timeout will catch persistent failures
      }
    }, 3000)

  } catch (err) {
    setIsValidating(false)
    setValidationError(err instanceof Error ? err.message : 'Validation failed. Please retry.')
  }
}
```

- [ ] **Step 4: Update the "Start Validation" button**

Find the button and update its disabled/label state:

```tsx
<Button onClick={handleStartValidation} disabled={isValidating}>
  {isValidating ? 'Validating...' : 'Start Address Validation'}
</Button>
```

- [ ] **Step 5: Replace the progress bar with an indeterminate bar**

The `processed` field from the status route is always 0 while the job is running — do NOT use it for a percentage. Replace any existing percentage progress bar with:

```tsx
{isValidating && (
  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
    <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
  </div>
)}
```

- [ ] **Step 6: Add the error alert**

Below the button, add:

```tsx
{validationError && (
  <Alert variant="destructive" className="mt-4">
    <AlertDescription className="flex items-center justify-between">
      <span>{validationError}</span>
      <Button variant="outline" size="sm" onClick={() => {
        setValidationError(null)
        handleStartValidation()
      }}>
        Retry
      </Button>
    </AlertDescription>
  </Alert>
)}
```

- [ ] **Step 7: Add the UndeliverablePanel below results**

After the results cards section, add:

```tsx
{(orderState.addressValidation?.undeliverableCount ??
  orderState.accuzipValidation?.undeliverableCount ?? 0) > 0 && (
  <UndeliverablePanel records={orderState.addressValidation?.validatedRecords ?? []} />
)}
```

- [ ] **Step 8: Check file LOC**

```bash
wc -l components/orders/steps/AddressValidationStep.tsx
```

If > 350 lines, extract `UndeliverablePanel` to `components/orders/steps/UndeliverablePanel.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface UndeliverablePanelProps {
  records: any[]
}

export function UndeliverablePanel({ records }: UndeliverablePanelProps) {
  const [expanded, setExpanded] = useState(false)
  const undeliverable = records.filter(r => !r.is_deliverable)

  if (undeliverable.length === 0) return null

  return (
    <div className="mt-4">
      <button
        className="text-sm text-muted-foreground underline"
        onClick={() => setExpanded(e => !e)}
      >
        View {undeliverable.length} undeliverable address{undeliverable.length !== 1 ? 'es' : ''}{' '}
        {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <Table className="mt-2">
          <TableHeader>
            <TableRow>
              <TableHead>Original Address</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {undeliverable.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-sm">
                  {r.address_line_1}, {r.city}, {r.state} {r.zip}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.validation_errors?.[0] ?? 'Undeliverable'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

If extracted, import it at the top of `AddressValidationStep.tsx`:
```tsx
import { UndeliverablePanel } from './UndeliverablePanel'
```

- [ ] **Step 9: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -E "(AddressValidation|UndeliverablePanel)"
```

Expected: no errors.

- [ ] **Step 10: Manual smoke test**

```bash
npm run dev
```

Navigate to Step 2. Click "Start Address Validation". Verify:
- Button shows "Validating..."
- Animated indeterminate bar appears
- After ~5 seconds (simulated), button resets and results cards show counts
- If any undeliverable records: the "View X undeliverable addresses" toggle appears and expands

- [ ] **Step 11: Commit**

```bash
git add components/orders/steps/AddressValidationStep.tsx
# if extracted:
git add components/orders/steps/UndeliverablePanel.tsx
git commit -m "feat: replace mock AccuZip with real polling in step 2"
```

---

## Task 12: Full end-to-end smoke test

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: pricing tests pass, no new failures.

- [ ] **Step 2: TypeScript clean check**

```bash
npx tsc --noEmit 2>&1 | wc -l
```

Note the number. It should not be higher than before this work started (existing errors are pre-existing; this work should add zero new ones).

- [ ] **Step 3: Navigate through all 6 steps**

```bash
npm run dev
```

Go to `http://localhost:3000/orders/new`.

| Step | Verify |
|------|--------|
| 1 — Data & Mapping | File upload OR Manual Entry works; column mapping tab enabled after data added |
| 2 — Address Validation | "Start Address Validation" triggers real API call (check Network tab); results populate |
| 3 — Design | Canvas renders (CanvasArea, ToolsSidebar visible) |
| 4 — Campaign Settings | Mailing options form renders |
| 5 — Review | Pricing loads from `/api/orders/pricing` (check Network tab); order summary renders |
| 6 — Payment | Payment methods load from `/api/payments/methods` |

- [ ] **Step 4: Verify draft auto-save**

Stay on any step for 30+ seconds. In Network tab, verify `POST /api/orders/drafts` fires and returns `{ orderId: "..." }`.

- [ ] **Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: e2e smoke test cleanup"
```

---

## Completion Checklist

- [ ] `npx tsc --noEmit` has no new errors vs. baseline
- [ ] `npm test` passes (pricing unit tests: 4 passing)
- [ ] Navigation works: Next/Back moves through all 6 steps
- [ ] Manual Entry form: add, validate, remove recipients
- [ ] Step 2: real AccuZip API called (not mock), results cards populated
- [ ] Draft auto-saves every 30s (network call visible)
- [ ] No console errors in browser during normal wizard flow

---

## Follow-On Plan

`docs/superpowers/plans/2026-03-22-order-wizard-mlm.md` — covers:
- `user_integrations` Supabase table
- `lib/integrations/mlm-client.ts`
- 6 MLM API routes (status, connect, callback, disconnect, lists, lists/import)
- `hooks/use-mlm-connection.ts` (SWR)
- `MlmListPicker.tsx` + wiring into Step 1
- "Save to MLM" checkbox
- Settings page Integrations tab
