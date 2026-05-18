---
kind: knowledge
slug: features
status: current
updated: 2026-05-18
layer: reference
sources:
  - dev-docs/features-and-dashboards.md
  - dev-docs/todo.md
  - app/
  - components/
  - lib/
  - supabase/
---

# Features — code-verified inventory

Status legend: **BUILT** = working with code evidence; **PARTIAL** = wired but degraded/mock/no UI; **UNVERIFIED** = not inspected/not found.
Every row carries a `path` from the codebase audit (dossier §B/§C). Counts: BUILT 49 / PARTIAL 12 / UNVERIFIED 3 / PLANNED 0-in-code.

## BUILT

| Area | Feature | Evidence path |
|---|---|---|
| auth | Email/Google login, signup+verify, reset, middleware, auth modal | `components/auth/auth-flow-modal/auth-service.ts`, `lib/auth/middleware.ts`, `app/auth/callback/route.ts` |
| list-builder | Full filter accordion UI | `app/mailing-services/build-lists/page.tsx`, `components/list-builder/*` |
| mailing-lists | CSV/XLSX import, dedup, manager UI, version history | `app/api/mailing-lists/{import-spreadsheet,deduplicate,version-history}/route.ts` |
| design | Custom WYSIWYG designer (19 files), fonts, asset library, share links | `app/design/customize/page.tsx`, `components/designer/`, `app/api/design/save/route.ts`, `app/api/assets/route.ts` |
| orders | Multi-step order wizard (17 step files), drafts (30-day autosave), submit | `app/orders/new/page.tsx`, `components/orders/OrderProvider.tsx` |
| payments | Stripe manual-capture lifecycle: intent/authorize/capture/refund/methods/webhook | `app/api/payments/*`, `lib/payments/*` |
| validation | Local format/state/ZIP logic; order AccuZip step UI | `lib/validation/address-validation.ts` |
| analytics | Short-link create+click tracking, engagement events, admin analytics (real DB) | `app/s/[shortCode]/route.ts`, `lib/admin/analytics-service.ts` |
| multi-tenant | Team create/invite/accept/members, time-based permissions, audit logging | `app/api/team/*`, `lib/access-control/`, `lib/audit/` |
| admin | Dashboard+health, user mgmt (`withAdmin`), pricing CRUD + change log, order mgmt, analytics, credits | `app/dashboard/admin/*`, `app/api/admin/*` |
| other | Contact cards CRUD, tag system, bulk ops, enhanced campaigns (split/recurring/deps), vendor mgmt, version-history undo/redo, internal webhooks, in-process job queue | `app/api/*`, `components/*`, `lib/*` |
| integrations | Stripe (manual capture) | `lib/payments/*`, `app/api/payments/*` |
| integrations | Supabase DB + Storage (storage fallback) | `lib/supabase/*`, `lib/assets/*` |

> BUILT total = 49 features across the areas above (representative rows; full per-feature list in dossier §B). Admin pricing UI fulfills `memory:project_admin_pricing` — see [[knowledge/superseded]] D4.

## PARTIAL

| Area | Feature | Why partial | Evidence path |
|---|---|---|---|
| infra | Rate limiting | In-memory only, not distributed | `lib/*` (in-memory) |
| list-builder | List-count estimate / AccuZip search+fetch / MelissaData buildList | Degrade to mock/throw without API key | `lib/api/accuzip/*`, `lib/api/melissa-data.ts` |
| validation | AccuZip upload/validate job | Simulated via `Math.random()` | `app/api/accuzip/upload/route.ts:135` (`processAccuZipValidation`) |
| design | Template gallery | Static data, no DB | `data/templates-data.ts` |
| payments | Subscription CRUD | Wired, no surfaced UI; dead per transactional model | `lib/payments/subscription-service.ts`, `app/api/subscriptions/*` |
| multi-tenant | Project-level RBAC | Scope unclear; `projects` table not in migrations | `lib/access-control/` |
| other | Notification settings | No backend | settings UI shell |
| other | API-keys page | UI shell only | API-keys page |
| orders | User orders dashboard | Reads empty/mock `lib/data-structures.ts` | `app/dashboard/orders/page.tsx:15` |
| integrations | AccuZip (list/search) | Real HTTP, mock w/o `ACCUZIP_API_KEY` | `lib/api/accuzip/*` |
| integrations | MelissaData | Throws w/o key; no purchase wiring | `lib/api/melissa-data.ts` |
| integrations | Mailgun | Inbound only; CSV parse = TODO; no outbound send | `app/api/skip-trace/webhook/results/route.ts` |

> Several PARTIAL items are also flagged for user confirmation — see [[knowledge/superseded]] F1–F5.

## PLANNED

No PLANNED features exist in code (0 code refs). Unbuilt roadmap work is reconciled in [[knowledge/roadmap]] (includes Redstone — doc-only, `dev-docs/api-redstone.md`; OpenAI/Anthropic — env-only, MCP keys, no app wiring).

## SUPERSEDED

Doc-vs-truth deltas (subscriptions, FPD, per-record AccuZip billing, 8-tier roles, admin-pricing-now-built) are tracked in [[knowledge/superseded]]. Do not treat subscription/FPD/8-role/per-record code or docs as live product surface.

## UNVERIFIED

| Feature | Note | Pointer |
|---|---|---|
| Mailgun outbound | No SDK/send found | dossier §B |
| Security / 2FA page | Not inspected | dossier §B |
| RBAC `projects` table | Not present in migrations | dossier §B |
