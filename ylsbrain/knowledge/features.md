---
kind: knowledge
slug: features
status: current
updated: 2026-07-31
layer: reference
sources:
  - dev-docs/implementation-status.md
  - docs/temp/reports/feature-completeness-report-2026-06-14.md
  - app/
  - components/
  - lib/
  - supabase/migrations/
---

# Features — code-verified inventory

Status legend: **BUILT** = entrypoint + non-stub logic + wired end-to-end (cited
path); **PARTIAL** = wired but degraded/mock/unwired; else PLANNED/UNVERIFIED.

> Reconciled 2026-07-31 (full codebase audit, 3 agents + direct re-verification
> of every previously-open gap). The detailed evidence matrix lives in
> `dev-docs/implementation-status.md` — this file is the delta ledger.
> Scale: 34 pages · 113 API routes · 483 components · 34 migrations / 46 tables /
> 31 RPCs / 84 RLS policies · 199 Mocha tests green + 9 SQL assertion tests.

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
- **Infra**: local Docker Supabase stack + replayable migrations; prod
  reconciled 2026-06-17 (6 missing migrations applied) + CI migration runner

## PARTIAL (re-verified 2026-07-31 — the live gap list)

| Feature | Gap | Evidence |
|---|---|---|
| Admin revenue analytics / capture-refund persistence / LTV | `payment_transactions` referenced by 6 files, **no migration creates it** | `lib/admin/analytics-service.ts` et al. |
| Admin order service | queries `orders.user_id`; live column is `created_by` | `lib/admin/order-service.ts:26` |
| Vendor fulfillment | `assignVendor` = audit row only; no dispatch; orders dead-end at `processing` | `lib/admin/order-service.ts:155` |
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

## Risk / hygiene flags (2026-07-31 inventory)

Middleware matcher covers only `/dashboard/*` (other areas rely on per-route
`withAuth` + client guards); `analytics/performance` trusts `userId` param
(IDOR); bare handlers incl. `payments/create-payment-intent|capture|refund`,
`mailing-lists/*`, `/api/teams/*`; shipped debug endpoints `api/test-db*`,
`api/test-auth-state`, `/test-types`; duplicate stacks (`/api/team` vs
`/api/teams`, `payment-service` vs `payment-service-new`, tags vs
tag-management, signup vs register); `@playwright/mcp` in prod deps;
typecheck:full regression (2 errors) fixed 2026-07-31.

## SUPERSEDED

Doc-vs-truth deltas in [[knowledge/superseded]] (no subscriptions, no FPD,
2-role + team roles, tiered AccuZip, admin pricing delivered). Dev-docs all
carry staleness banners → `dev-docs/implementation-status.md`.
