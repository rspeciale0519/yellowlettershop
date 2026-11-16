# Campaign / order

Core money path: pick a starting point, then a 6-step order stepper (`app/orders/new/page.tsx`, `ORDER_STEPS` in `types/orders.ts`).

## Sub-features

- `/new-campaign` chooser: **Quick Start**, **Build New List**, **Custom Design**, **Browse Templates**
- Stepper: **Data & Mapping** → **Address Validation** → **Design & Content** → **Campaign Settings** → **Review & Approval** → **Payment**
- Data source buttons: **Upload File**, **Existing List**, **Manual Entry**
- Tabs: `1. Select Data Source`, `2. Map Columns`
- Nav: **Back**, **Cancel**, **Continue to Address Validation** (disabled until mapping is complete)
- Stripe payment (test keys only). Print dispatch after capture — do not name the vendor; do not send live mail.

## How to get to it (user POV)

1. Header **New Campaign** → `/new-campaign` (unauthenticated: `/?auth=login&redirectedFrom=/new-campaign`).
2. **Quick Start** / **Start Campaign** → `/orders/new?source=dashboard_create_new`.
3. Other entries: `?templateId=`, `?listId=`, `?source=list_builder`, `?source=design_tool`, `?reorderId=`.
4. Dashboard **Place New Order** / **Place your first order**.

## Driving it with the verify-yls harness

```bash
node .cursor/skills/verify-yls/scripts/drive.mjs --feature campaign-order
```

Harness checks step 1 on `/orders/new?source=dashboard_create_new`:

- Heading **Create New Order**
- **Data & Mapping**, **Choose Your Data Source**
- **Upload File**, **Existing List**, **Manual Entry**
- **Continue to Address Validation**
- Screenshot: `orders-new.png`

To continue as a user (do not skip these just because APIs 401):

1. Sign in (see [auth.md](auth.md)) — required for list APIs and payment.
2. Upload a CSV or pick **Existing List** (needs a list in local DB).
3. Map required address columns, then **Continue to Address Validation**.
4. AccuZip validation (local/test credentials only).
5. Design, campaign settings, review.
6. Payment: Stripe **test** card only. Stop if `STRIPE_SECRET_KEY` is not `sk_test_`. Never capture a live charge.
7. Observe whether print dispatch ran or was skipped (no active vendor row). Record the skip; do not invent a pass.

## Gotchas

- `/orders/new` is **not** in `middleware.ts` (`/dashboard/:path*` only). The stepper UI renders without a session. That is not a completed order. List fetch, upload persist, AccuZip, and PaymentIntent still need auth + backends.
- `/new-campaign` **does** client-auth-gate and will not show **Create New Campaign** while signed out.
- Continue stays disabled until `isMappingComplete`.
- No Docker: AccuZip, list picker, and Stripe intent will fail. Leave the journey failing at that step; do not stub a paid order.
- Seed: `supabase/seed.sql` after `npx supabase start` if you need an existing list. If seed lacks a list the **Existing List** path needs, record that under this Gotchas section — do not drop the path.
- Never complete Payment with live keys. Never call hosted Supabase.

## Observable end state

**Harness (step 1):** `/orders/new` shows **Create New Order**, **Data & Mapping**, and the three data-source buttons.

**Full order (local/test only):** a row in local `orders` with `payment_status` authorized/captured in **test** mode, review/proof UI, and an explicit note of whether vendor dispatch was skipped. Anything less is a partial drive, not a pass of the money path.
