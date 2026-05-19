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
Every row carries a real `path` from the codebase audit. This inventory is self-contained — each feature is enumerated individually below. Counts: BUILT 49 / PARTIAL 12 / UNVERIFIED 3 / PLANNED 0-in-code.

## BUILT

Area summary: Auth (6), List-builder (1), Mailing-lists (4), Design (5), Orders (3), Payments (6), Validation (2), Analytics (4), Multi-tenant (6), Admin (6), Profile (1), Contact-cards (1), Tags (1), Bulk-ops (1), Campaigns (2), Vendors (1), Version-history (1), Jobs (1), Webhooks (1), Integrations (2). Admin pricing UI fulfills `memory:project_admin_pricing` — see [[knowledge/superseded]] D4.

| Area | Feature | Evidence path |
|---|---|---|
| Auth | Login/Logout email+password | `components/auth/auth-flow-modal/auth-service.ts:loginWithEmail`, `app/auth/callback/route.ts` |
| Auth | Google OAuth | `components/auth/auth-flow-modal/auth-service.ts:loginWithGoogle` |
| Auth | Signup + email verification | `auth-service.ts:signUp` |
| Auth | Forgot/reset password | `auth-service.ts:resetPassword,updatePassword` |
| Auth | Auth middleware / protected routes + role checks | `lib/auth/middleware.ts:withAuth,getAuthenticatedUser` |
| Auth | Global auth modal flow | `components/auth/auth-flow-modal/index.tsx`, `app/login/page.tsx` |
| List-builder | Filter UI (geo/demo/property/mortgage/foreclosure/options) | `app/mailing-services/build-lists/page.tsx`, `components/list-builder/*` |
| Mailing-lists | CSV/XLSX import + column mapping | `app/api/mailing-lists/import-spreadsheet/route.ts` |
| Mailing-lists | Deduplication | `app/api/mailing-lists/deduplicate/route.ts` |
| Mailing-lists | Manager UI (add/edit/delete/import/dedup/history) | `app/mailing-services/mailing-list-manager/page.tsx` |
| Mailing-lists | Version history + change tracking | `app/api/mailing-lists/version-history/route.ts`, `lib/version-history/change-tracker.ts` |
| Design | Custom WYSIWYG canvas (19 files: tools/layers/pages/fonts/images/preview) | `app/design/customize/page.tsx`, `components/designer/` |
| Design | Design save/update | `app/api/design/save/route.ts` → `user_designs` |
| Design | Font loading API | `app/api/designer/fonts/`, `supabase/migrations/20260507000000_designer_fonts.sql` |
| Design | Asset library CRUD + storage fallback | `app/api/assets/route.ts`, `components/media/` |
| Design | Asset share links | `app/api/share-links/route.ts` → `asset_share_links` |
| Orders | Multi-step order wizard (17 step files) | `app/orders/new/page.tsx`, `components/orders/OrderProvider.tsx`, `components/orders/steps/` |
| Orders | Order draft persistence (30-day autosave) | `app/api/orders/drafts/`, `supabase/migrations/20260322000000_order_tables.sql` |
| Orders | Order submit | `app/api/orders/submit/route.ts` |
| Payments | Stripe payment intent (manual capture) | `app/api/payments/create-payment-intent/route.ts`, `lib/payments/payment-intent-service.ts` |
| Payments | Payment authorization | `app/api/payments/authorize/route.ts` |
| Payments | Payment capture | `app/api/payments/capture-payment/route.ts` |
| Payments | Payment methods management | `app/api/payments/payment-methods/route.ts`, `components/payments/PaymentMethodManager.tsx` |
| Payments | Stripe webhook handler (sig verify, IP allowlist) | `app/api/payments/webhooks/stripe/route.ts` |
| Payments | Refund | `app/api/payments/refund-payment/route.ts` |
| Validation | Local format/state/ZIP validation | `lib/validation/address-validation.ts`, `app/api/validation/address/route.ts` |
| Validation | Order workflow AccuZip step UI | `components/orders/steps/AccuZipValidationStep.tsx`, `AddressValidationStep.tsx` |
| Analytics | Short-link create + click tracking | `lib/analytics/engagement-tracker.ts`, `app/api/analytics/short-links/route.ts`, `app/s/[shortCode]/route.ts` |
| Analytics | Engagement event recording | `app/api/analytics/events/route.ts` |
| Analytics | Performance metrics API | `app/api/analytics/performance/route.ts` |
| Analytics | Admin analytics dashboard (real DB) | `app/dashboard/admin/analytics/page.tsx`, `lib/admin/analytics-service.ts:getAnalyticsMetrics` |
| Multi-tenant | Team creation | `app/api/team/create/route.ts`, `lib/team/team-service.ts:createTeam` |
| Multi-tenant | Member invite | `app/api/team/invite/route.ts` |
| Multi-tenant | Invitation acceptance | `app/api/team/accept-invitation/route.ts` |
| Multi-tenant | Team member management UI | `app/api/team/members/route.ts`, `app/dashboard/team-management/page.tsx` |
| Multi-tenant | Time-based permissions | `lib/access-control/time-based-permissions.ts`, `app/api/access-control/` |
| Multi-tenant | Audit logging | `lib/audit/enhanced-audit-logger.ts`, `supabase/migrations/20260328000001_admin_audit_log.sql` |
| Admin | Dashboard + health checks | `app/dashboard/admin/page.tsx`, `app/api/admin/health/route.ts` |
| Admin | User management (`withAdmin`) | `app/api/admin/users/route.ts`, `lib/admin/user-service.ts` |
| Admin | Pricing management CRUD + change log | `app/dashboard/admin/pricing/page.tsx`, `app/api/admin/pricing/route.ts`, `supabase/migrations/20260328000002_pricing_tables.sql` |
| Admin | Order management | `app/api/admin/orders/route.ts`, `app/dashboard/admin/orders/` |
| Admin | Audit log | `lib/admin/audit-logger.ts`, `supabase/migrations/20260328000001_admin_audit_log.sql` |
| Admin | User credits / notes | `supabase/migrations/20260328000004_user_management_tables.sql` |
| Profile | User profile (personal/business/preferences) | `app/dashboard/profile/page.tsx`, `components/profile/` |
| Contact-cards | Contact card CRUD (Zod, RLS) | `app/api/contact-cards/route.ts`, `app/dashboard/contact-cards/page.tsx` |
| Tags | Tag CRUD + hierarchical | `app/api/tags/route.ts`, `lib/tag-system/index.ts` |
| Bulk-ops | Bulk tag/delete/update/export (queue) | `app/api/bulk-operations/route.ts`, `lib/bulk-operations/` |
| Campaigns | Enhanced campaign create (split/recurring/deps) | `app/api/campaigns/enhanced/route.ts`, `lib/campaigns/enhanced-campaign-service.ts` |
| Campaigns | Campaign execute / payment | `app/api/campaigns/[campaignId]/execute/route.ts`, `lib/campaigns/payment-integration.ts` |
| Vendors | Vendor management CRUD + performance | `lib/vendors/vendor-service.ts`, `app/api/vendors/route.ts` |
| Version-history | Change tracking + undo/redo | `lib/version-history/change-tracker.ts`, `lib/version-history/undo-redo.ts` |
| Jobs | In-process job queue create/poll | `app/api/jobs/route.ts`, `lib/jobs/job-queue.ts` |
| Webhooks | Internal outbound webhook system (sig verify, delivery log) | `app/api/webhooks/route.ts` |
| Integrations | Stripe (full manual-capture lifecycle) | `lib/payments/*`, `app/api/payments/*` |
| Integrations | Supabase DB + Storage (storage fallback) | `lib/supabase/*`, `lib/assets/storage-fallback.ts` |

## PARTIAL

| Area | Feature | Why partial | Evidence path |
|---|---|---|---|
| Auth | Rate limiting | In-memory map, resets on restart, not production-safe | `lib/auth/middleware.ts:rateLimit` |
| List-builder | List-count estimate | Falls back to random mock without `ACCUZIP_API_KEY` | `app/api/list-builder/estimate/route.ts`, `lib/list-builder/list-builder-service.ts:estimateListBuild` |
| List-builder | AccuZip search/fetch records | Real HTTP but returns empty without key | `app/api/accuzip/search/route.ts`, `lib/api/accuzip/fetch.ts` |
| List-builder | MelissaData buildList | Real HTTP but client throws without `MELISSA_DATA_API_KEY` | `lib/list-builder/list-builder-service.ts:buildList`, `lib/api/melissa-data.ts` |
| Validation | AccuZip upload/validate job | Simulated (`Math.random()` deliverability), no real API call | `app/api/accuzip/upload/route.ts:processAccuZipValidation` |
| Design | Template gallery | Static `data/templates-data.ts`, no DB table | `app/templates/page.tsx`, `data/templates-data.ts` |
| Orders | User orders dashboard | Reads empty static array, no DB query | `app/dashboard/orders/page.tsx`, `lib/data-structures.ts` |
| Payments | Subscription CRUD | Wired to Stripe+DB but no surfaced UI; dead per transactional model | `app/api/subscriptions/*`, `lib/payments/subscription-service.ts` |
| Multi-tenant | Project-level RBAC | Functions exist but `projects` table not in migrations; scope unclear | `lib/rbac/index.ts` |
| Profile | Notification settings | Local state only, no API/persistence | `app/dashboard/notifications/page.tsx` |
| Profile | API keys management | UI shell, no create/fetch wiring | `app/dashboard/api-keys/page.tsx` |
| Integrations | Mailgun | Inbound webhook only (CSV parse = TODO); no outbound send | `app/api/skip-trace/webhook/results/route.ts` |

> Several PARTIAL items are CONFIRMED doc-vs-code deltas (user-confirmed 2026-05-19) — see [[knowledge/superseded]] F1–F5.

## PLANNED

No PLANNED features exist in code (0 code refs). Unbuilt roadmap work is reconciled in [[knowledge/roadmap]] (includes Redstone — doc-only, `dev-docs/api-redstone.md`; OpenAI/Anthropic — env-only, MCP keys, no app wiring).

## SUPERSEDED

Doc-vs-truth deltas (subscriptions, FPD, per-record AccuZip billing, 8-tier roles, admin-pricing-now-built) are tracked in [[knowledge/superseded]]. Do not treat subscription/FPD/8-role/per-record code or docs as live product surface.

## UNVERIFIED

| Feature | Note | Evidence path |
|---|---|---|
| Mailgun outbound send | No SDK/send call found anywhere | `lib/team/team-service.ts:491` (comment stub) |
| Security / 2FA page | Page exists, not inspected | `app/dashboard/security/page.tsx` |
| RBAC `projects` table | Referenced by `lib/rbac/index.ts` but absent from `supabase/migrations/` | `lib/rbac/index.ts` |
