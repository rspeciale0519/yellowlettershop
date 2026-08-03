---
kind: knowledge
slug: features
status: current
updated: 2026-08-02
layer: reference
sources:
  - dev-docs/implementation-status.md
  - docs/temp/reports/feature-completeness-report-2026-06-14.md
  - app/
  - components/
  - lib/
  - supabase/migrations/
  - memory:project-vercel-project
---

# Features — code-verified inventory

Status legend: **BUILT** = entrypoint + non-stub logic + wired end-to-end (cited
path); **PARTIAL** = wired but degraded/mock/unwired; else PLANNED/UNVERIFIED.

> Reconciled 2026-07-31 (full codebase audit); release delta applied 2026-08-02.
> The detailed evidence matrix lives in `dev-docs/implementation-status.md` —
> this file is the delta ledger.
> Scale (2026-08-02): 34 pages · 113 API routes · 484 components · 37 migrations
> / 48 tables / 31 RPCs / 84 RLS policies · **269 Mocha tests green** + 9 SQL
> assertion tests.

> **2026-08-02 — first production release of the fulfillment work.** `develop`
> merged to `main` (`1cbc0ee`), migrations applied to the hosted project, live
> on `app.yellowlettershop.com`. Everything below marked 2026-07-31/08-01/08-02
> had never shipped before this. Detail: `dev-docs/implementation-status.md` §0.

## BUILT (verified)

- **Customer money path end-to-end** (since 2026-06-13, hardened since): wizard →
  drafts → real AccuZip validation → design → Stripe authorize (manual capture) →
  pdf-lib proof (private bucket, signed URL) → approve→capture / reject→cancel →
  confirmation email → status timeline → real orders + home dashboards.
  `app/orders/`, `app/api/orders/*`, `app/api/payments/*`, `lib/orders/*`
- **Designer suite** (custom, no FPD): 69 modules — canvas/inspector/preflight/
  tokens + merge preview, mail-spec + USPS overlays, **postage areas**
  (stamp/indicia keep-clear, 2026-06-17), **3D preview** (three.js/R3F,
  `components/design-preview-3d/`, 2026-07), rotation+opacity across
  editor/PDF/3D (2026-07-30), server PDF renderer
  `app/api/design/preview/_render/`, fonts API, asset library + share links
- **Teams & access control** (rebuilt 2026-06-15→16, browser-E2E'd): teams /
  members / invitations tables + SECURITY DEFINER RPCs + RLS
  (`20260616000000`–`000600`), Resend invite email, Owner/Admin/Member,
  transfer/delete/seat cap; permission templates + **name-based resource
  picker w/ wildcard grants**; time-based permissions; 9 SQL assertion tests
  `supabase/tests/`
- **Auth/security**: email + Google OAuth, auto-profile on signup, working
  sign-out, **real TOTP 2FA** (`lib/auth/mfa.ts`), **real login history**
  (`get_my_sessions` over auth.sessions) + revoke-all-sessions, `withAuth`
  Bearer+cookie, `withAdmin` (admin|super_admin), PII RLS hardening, sb_* keys
- **Mailing lists**: CSV/XLSX/ODS import → `mailing_list_records`, column
  mapping w/ required-field gate, dedup, version history + restore, audit log,
  manager UI (84 components)
- **Platform**: transactional email adapter (Resend/Mailgun) wired into
  submit/proof/capture/invite (`lib/email/`), durable DB job queue
  (`background_jobs`), outbound webhooks w/ HMAC + retry + dead-letter,
  bulk ops, tags, contact cards, vendors CRUD+performance, enhanced campaigns
  (create/execute/split), short-links + engagement analytics, admin suite
  (users/credits/notes/password-reset, pricing CRUD UI, orders UI, health)
- **Vendor fulfillment** (2026-07-31, LIVE 2026-08-02): capture → auto-dispatch
  → vendor emailed proof + recipient CSV (7-day signed) → admin advances
  accepted/in-production/mailed(+tracking)/delivered → order completes, customer
  emailed on ship. `lib/fulfillment/` (8 modules), `order_dispatches`, admin
  dispatch API + panel. One live dispatch per order enforced by
  `uq_order_dispatches_live`; status advance is compare-and-swap so concurrent
  admins cannot double-send the "shipped" email. **Redstone API dispatch is
  built and opt-in** per vendor (`contact_info.integration = "redstone"`),
  defaulting to test mode; the email hand-off remains the working fallback.
  Blocked on Redstone provisioning our endpoint, not on our code
  (`implementation-status.md` §8b)
- **Money-moment confirmations** (2026-08-01): both authorize and capture sit
  behind an explicit amount-forward dialog
  (`components/orders/confirm-action-dialog.tsx`); capture previously had none
  and reject used a bare `window.confirm`. Review-step approval collapsed from
  4 UI checkboxes the gate never enforced to 2 that it does
- **Infra**: local Docker Supabase stack + replayable migrations; prod
  reconciled 2026-06-17 (6 missing migrations applied) + CI migration runner;
  **one** Vercel project serves the app (`yellowlettershop`, owns
  `app.yellowlettershop.com` — `memory:project-vercel-project`; two decoys
  deleted 2026-08-02 after they collided on one GitHub status context)

## PARTIAL (re-verified 2026-07-31 — the live gap list)

> Three rows CLEARED 2026-07-31 by `feature/vendor-fulfillment`: admin revenue/
> LTV (inline-payment refactor), admin order-service drift, and vendor
> fulfillment (now BUILT — `lib/fulfillment/`, `order_dispatches`, dispatch API
> + admin panel; live-verified end-to-end INCLUDING the storage leg: CSV staged,
> links signed, signed CSV fetched back 200 w/ exact column contract). Also fixed there: `orders.updated_at` was
> written by 6 call sites but **does not exist**, silently voiding those updates
> including the Stripe webhook capture backstop.

| Feature | Gap | Evidence |
|---|---|---|
| Template galleries (both) | static/mock arrays; `mail_templates` has no migration | `app/dashboard/templates/page.tsx:27` |
| List-builder estimate | silent mock fallback w/o Melissa key; `accuzip/count.ts` random w/o key | `hooks/use-list-estimate.ts:29` |
| `/api/validation/address` | still simulated CASS (order path IS real) | `lib/validation/address-validation.ts:127` |
| Skip tracing | inbound webhook TODO no-op; no UI/export/dispatch | `app/api/skip-trace/webhook/results/route.ts:89` |
| Campaign recurring (D7) | scheduler = console.log stub | `enhanced-campaign-service.ts:441` |
| Drafts autosave | dormant until first manual save | `components/orders/OrderProvider.tsx:48` |
| Rate limiting | DB-backed limiter has zero callers; in-memory Map live | `lib/auth/middleware.ts:198` |
| Proof annotations | table exists, **zero code refs** — no viewer/UI | migrations vs grep |
| Activity page | mock data | `app/dashboard/activity/page.tsx:27` |
| Undo/redo | one resource type only | `lib/version-history/undo-redo.ts:90` |
| Subscription code | dead by design, not yet archived | `lib/payments/subscription-service.ts` |

Notification-settings + API-keys mock pages were **removed** 2026-06-13 (no
longer PARTIAL rows). Login-history and 2FA rows moved to BUILT.

## Differentiators D1–D10

D3 BUILT (split scheduling) · D1/D4/D7/D8/D9 PARTIAL · D2/D5/D6/D10 NOT BUILT.
Detail: `dev-docs/implementation-status.md` §6.

## Risk / hygiene flags (re-verified 2026-08-02)

Middleware matcher covers only `/dashboard/*` (other areas rely on per-route
`withAuth` + client guards); `analytics/performance` trusts `userId` param
(IDOR); bare handlers remain at `payments/create-payment-intent`,
`mailing-lists/*`, `/api/teams/*` (bare `capture-payment`/`refund-payment` were
archived to `archive/api-payments-2026-08/`); shipped debug endpoints
`api/test-db*`, `api/test-auth-state`, `/test-types` — **all four still present
and now live in production**, so their priority is higher than it was; duplicate
stacks (`/api/team` vs `/api/teams`, `payment-service` vs `payment-service-new`,
tags vs tag-management, signup vs register); `@playwright/mcp` in prod deps.

**New tripwire:** the dispatch ownership gate needs `mailing_lists.created_by`
to match the order owner OR a shared non-NULL `team_id` — a team-shared list
with NULL `team_id` will now be refused. Same rule AccuZip upload already
enforces.

## SUPERSEDED

Doc-vs-truth deltas in [[knowledge/superseded]] (no subscriptions, no FPD,
2-role + team roles, tiered AccuZip, admin pricing delivered). Dev-docs all
carry staleness banners → `dev-docs/implementation-status.md`.
