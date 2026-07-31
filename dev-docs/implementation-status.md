# YLS Implementation Status — Codebase-vs-Docs Audit

**Date:** 2026-07-31 · **Branch:** `develop` · **Method:** evidence-gated code
verification (3 parallel audit agents: full codebase inventory, planned-feature
extraction from the April-2025 dev-docs, factual-claim extraction from the
technical docs), reconciled against the two prior audits
(`docs/temp/yls-feature-audit-report.md` 2026-06-12,
`docs/temp/reports/feature-completeness-report-2026-06-14.md`) with every
previously-open gap re-verified directly in code this session.

**This file is the authoritative "what is actually built" document.** Every
other file in `dev-docs/` is an April/August-2025 planning baseline and carries
a staleness banner pointing here. Ground truth = code, never doc checkboxes.

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

## 2. Verification gates (this session, develop)

| Gate | Result |
|---|---|
| `npm test` (Mocha) | **199 passing, 0 failing** |
| `npm run typecheck:full` | **0 errors** (2 regressions from the June zero-baseline found and fixed this session) |
| `npm run build` | **exit 0** |
| `npm run lint` | ~743 pre-existing errors repo-wide — known debt, own backlog ticket (`memory:project_lint_debt_cleanup`); delta-gate model in use |

Scale (inventoried 2026-07-31): 34 page routes · 113 API route files ·
483 component files · 110 lib modules · 42 hooks · 34 migrations creating
46 tables + 31 functions/RPCs with 84 RLS policies · 32 Mocha test files +
9 SQL assertion tests (`supabase/tests/`).

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

### Platform services
- Outbound transactional email: Resend-preferred/Mailgun-fallback adapter, XSS-escaped templates, wired into submit / proof-ready / captured / team-invite — `lib/email/`
- Durable DB-backed job queue (`background_jobs`), outbound webhooks w/ HMAC + retry/backoff + dead-letter, bulk operations, tags (hierarchy/categories/bulk), contact cards, profile, vendors CRUD + performance + communications log, enhanced campaigns (create/execute/split), version-history undo/redo, short-link tracking + engagement events + admin analytics dashboard
- Admin suite: users CRUD/credits/notes/password-reset, pricing CRUD + change log, orders list/detail UI (`app/dashboard/admin/orders/`), health checks, settings
- Local Docker Supabase dev stack + replayable migration baseline; prod migration runner + CI workflow; prod DB reconciled 2026-06-17 (6 missing migrations applied)

---

## 4. PARTIAL — exists but degraded, mock, or unwired (all re-verified 2026-07-31)

| # | Feature | Gap | Evidence |
|---|---|---|---|
| 1 | Admin revenue analytics + admin capture/refund persistence + user LTV | Query **`payment_transactions` — no migration creates it** (6 files reference it) → revenue metrics 0 / persistence fails | `lib/admin/analytics-service.ts`, `order-service.ts`, `user-service.ts`, `app/api/payments/{capture,refund}-payment/` |
| 2 | Admin order service | Schema drift: queries `orders.user_id` + `user_profiles!inner` join; live table uses `created_by` (no FK join path) | `lib/admin/order-service.ts:20-26` vs `20260613000000` line 285 |
| 3 | Vendor fulfillment | `assignVendor` bumps `updated_at` + audit row only; **no routing/dispatch automation** — orders dead-end at `processing` after capture | `lib/admin/order-service.ts:155-178` |
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

- Proof **annotation** workflow (PDF.js viewer, threaded comments, x/y pins) — PRD §3.10
- Automated vendor routing/dispatch + email order dispatch + inbound vendor file processing — PRD §3.8
- Admin impersonation (type-only) — PRD §3.15
- Report builder / saved / scheduled reports — PRD §3.14
- NPS / feedback system, support ticketing — PRD §3.16
- AI features: content generation, contextual help (zero AI wiring in app) — PRD §3.11
- Mail tracking / delivery confirmation add-on — PRD §3.5
- Onboarding/guided first-run, address autocomplete, discount/referral codes
- Redstone API (doc-only: `dev-docs/api-redstone.md`, zero code refs)
- Public API keys / external REST API management, Zapier
- One-off single-recipient mail flow, reorder-with-edit flow
- GDPR export/deletion tooling, Sentry (or any error-monitoring service)

## 6. Differentiators D1–D10 (owner-approved 2026-06-12/13)

| D# | Feature | Status 2026-07-31 |
|---|---|---|
| D1 | Per-recipient QR / pURLs | PARTIAL — QR renderer + short-link backend; no per-recipient generation flow |
| D2 | AI copy assistant | NOT BUILT (zero AI wiring) |
| D3 | A/B split sending | BUILT (scheduling layer); winner declaration unverified |
| D4 | Template marketplace + stats | PARTIAL — galleries still static/mock |
| D5 | Win-back emails | NOT BUILT |
| D6 | CallRail integration | NOT BUILT (decision recorded; needs owner OAuth creds — `memory:project_callrail_integration`) |
| D7 | Drip sequences | PARTIAL — config/schema present, scheduler stub |
| D8 | Deliverability score | PARTIAL — designer preflight half BUILT; checkout combined score not built |
| D9 | Vendor-gated capture | PARTIAL — capture still fires on customer approval, not vendor confirmation |
| D10 | AI proof comparison | NOT BUILT |

## 7. Known risks / hygiene (from the 2026-07-31 inventory)

- **Security review candidates:** `middleware.ts` matcher covers only `/dashboard/:path*` — `/orders/*`, `/design/customize`, `/mailing-services/*` rely on client-side guards + per-route `withAuth`; `analytics/performance` trusts a `userId` query param (IDOR); several bare (unwrapped) API handlers incl. `payments/create-payment-intent`, `capture-payment`, `refund-payment`, all `mailing-lists/*`, `/api/teams/*`; shipped test/debug endpoints `api/test-db`, `api/test-db-verification`, `api/test-auth-state`, page `/test-types`.
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

## 9. Doc map — status of every dev-doc

| File | Verdict |
|---|---|
| `implementation-status.md` | **Authoritative** (this file) |
| `PRD.md`, `roadmap.md`, `todo.md`, `features-and-dashboards.md` | Historical April-2025 plan — useful for feature *intent*; checkboxes/statuses unreliable; superseded on FPD/subscriptions/roles/billing |
| `technical-architecture.md`, `development-guide.md`, `developer-quick-start-guide.md` | Stale on stack (FPD, Prisma, NextAuth, Jest/Cypress, Next 14, repo name, scripts); structure/intent partially valid |
| `api-accuzip.md`, `api-melissa.md`, `api-integrations.md`, `external-api-mapping.md` | Vendor/API reference — field mappings still useful; implementation-status columns stale (e.g. external-api-mapping calls Stripe "planned") |
| `api-redstone.md` | Doc-only; zero code refs; long-term |
| `cross-reference-mapping-with-code.md` | AI-generated cookbook, truncated mid-document; treat all "existing paths" claims as aspirational |
| `urls.txt` | Reference list |

Live reconciled knowledge (kept current by the ylsbrain protocol):
`ylsbrain/knowledge/{features,roadmap,superseded,orientation}.md`.
