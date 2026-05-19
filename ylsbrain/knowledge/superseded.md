---
kind: knowledge
slug: superseded
status: current
updated: 2026-05-18
layer: reference
sources:
  - dev-docs/PRD.md
  - dev-docs/roadmap.md
  - memory:project_no_subscriptions
  - memory:feedback_no_fpd
  - memory:project_validation_pricing
  - memory:project_admin_pricing
---

# Superseded — doc-vs-truth ledger

Where the April-2025 dev-docs diverge from project reality. Memory overrides stale docs. D1–D5 are memory-resolved; **F1–F5 are CONFIRMED 2026-05-19** (independently re-verified vs current code, then user-confirmed) — no longer provisional. Pointers only — read the cited source for detail.

### D1 — Revenue model: subscriptions → transactional
- **doc said:** Free/Pro/Team/Enterprise subscription tiers + $29/seat (`dev-docs/PRD.md §5`, `dev-docs/features-and-dashboards.md §1.2`).
- **truth is:** Transactional revenue only, no subscriptions; MLM is a separate app (`memory:project_no_subscriptions`). Subscription infra is wired but unsurfaced/dead (`lib/payments/subscription-service.ts`, `app/api/subscriptions/*`, `SUBSCRIPTION_PLANS`; `SubscriptionPlanCard` not rendered).
- **why:** MRR KPI, plan-gating, and plan-based limits are all stale; subscription code is reserved/inert and must not drive product decisions.

### D2 — Design engine: FPD → custom in-house
- **doc said:** Fancy Product Designer (FPD) is the design canvas (`dev-docs/PRD.md §3.4`, `dev-docs/technical-architecture.md §2.1`).
- **truth is:** Custom in-house designer; zero FPD refs in code. Full custom system in `components/designer/` (react-rnd), state = `DesignElement[]` (`types/designer.ts`) (`memory:feedback_no_fpd`).
- **why:** Every FPD doc reference is stale, including the admin "FPD rendering" review path; defer to the custom designer.

### D3 — AccuZip billing: per-record → tiered per-job
- **doc said:** $0.05/record validation + plan-based free quotas (`dev-docs/features-and-dashboards.md §5.2`, legacy `lib/payments/stripe-config.ts USAGE_PRICING`).
- **truth is:** Tiered $8–$400/job standalone, free with mail orders (`memory:project_validation_pricing`; impl `supabase/migrations/20260328000003_seed_pricing_data.sql:44-48`; admin pricing UI tab).
- **why:** Stale per-record / plan-gated free-validation logic still lives in `app/api/payments/calculate-pricing/route.ts:191-201` and contradicts the tiered truth.

### D4 — Admin pricing UI: future phase → FULFILLED
- **doc said:** Admin pricing management is a future phase (`dev-docs/PRD.md §7 Phase 3`); memory recorded a need for an admin pricing UI (`memory:project_admin_pricing`).
- **truth is:** **FULFILLED — fully built**: `app/dashboard/admin/pricing/page.tsx`, `app/api/admin/pricing/route.ts`, `lib/admin/pricing-service.ts`, `components/admin/pricing/*`, migrations `20260328000002` / `20260328000003`.
- **why:** The memory need is satisfied; record as resolved. No further work — admins manage pricing without code deploys.

### D5 — Role model: 8-tier / 4-role → admin|super_admin only
- **doc said:** 8-tier role model (`dev-docs/features-and-dashboards.md §1.1`) / 4-role model (`dev-docs/PRD.md §3.1`).
- **truth is:** Code has `admin|super_admin` only (`lib/admin/types.ts:3`, `lib/admin/require-admin.ts`); non-admins ungated beyond auth; `free|pro|team|enterprise` is a now-stale plan type, not a role.
- **why:** The 8-tier model was never implemented; role-gating docs and KPIs based on it are stale.

### F1 — AccuZip validation job: live vs simulated
- **doc said:** Real AccuZip validation API (`dev-docs/api-accuzip.md`).
- **truth is:** Validation-job path is simulated via `Math.random()` (`app/api/accuzip/upload/route.ts:135`, `processAccuZipValidation`).
- **why:** PARTIAL/simulated and **environment-independent** — `processAccuZipValidation` is hardcoded `Math.random()` with no env branch, so no `ACCUZIP_API_KEY`/deploy makes the order-flow path real. A real AccuZip HTTP client exists only for the list-builder count/search path (`lib/api/accuzip/count.ts` → `api.accuzip.com/v1`), not the order-flow upload. Confirmed 2026-05-19.
- **status:** CONFIRMED 2026-05-19 — code-reality is the settled truth (independently re-verified vs current code, then user-confirmed); the doc claim is superseded; the unbuilt portion is tracked in [[knowledge/roadmap]].

### F2 — MelissaData purchase flow
- **doc said:** Full list-purchase buy flow (`dev-docs/technical-architecture.md §2.5`).
- **truth is:** `lib/list-builder/list-builder-service.ts:56` hardcodes $0.10/record; no `app/api/list-builder/purchase/` route; no payment wiring.
- **why:** List-purchase is PARTIAL — estimate only (`$0.10/record` hardcoded "example pricing"), no purchase route, no payment integration. Confirmed 2026-05-19.
- **status:** CONFIRMED 2026-05-19 — code-reality is the settled truth (independently re-verified vs current code, then user-confirmed); the doc claim is superseded; the unbuilt portion is tracked in [[knowledge/roadmap]].

### F3 — Mailgun transactional (outbound) email
- **doc said:** Mailgun send + inbound (`dev-docs/api-integrations.md`).
- **truth is:** Inbound only; outbound send is a comment stub (`lib/team/team-service.ts:491`); no SDK/send found.
- **why:** Outbound email is PLANNED/absent; only inbound webhook parsing exists.
- **status:** CONFIRMED 2026-05-19 — code-reality is the settled truth (independently re-verified vs current code, then user-confirmed); the doc claim is superseded; the unbuilt portion is tracked in [[knowledge/roadmap]].

### F4 — Templates: DB marketplace vs static gallery
- **doc said:** DB-backed template marketplace (`dev-docs/features-and-dashboards.md`).
- **truth is:** `app/templates/page.tsx:9` browses static `data/templates-data.ts`; `app/api/templates/[id]/route.ts` queries `mail_templates` (partial DB path).
- **why:** Gallery is PARTIAL — static browse plus a partial DB-backed fetch path.
- **status:** CONFIRMED 2026-05-19 — code-reality is the settled truth (independently re-verified vs current code, then user-confirmed); the doc claim is superseded; the unbuilt portion is tracked in [[knowledge/roadmap]].

### F5 — User orders dashboard: live vs mock
- **doc said:** Live real-time user orders dashboard.
- **truth is:** `app/dashboard/orders/page.tsx:15` reads mock `lib/data-structures.ts`; admin orders dashboard is real.
- **why:** User orders dashboard is PARTIAL (scaffold/mock); admin path is BUILT.
- **status:** CONFIRMED 2026-05-19 — code-reality is the settled truth (independently re-verified vs current code, then user-confirmed); the doc claim is superseded; the unbuilt portion is tracked in [[knowledge/roadmap]].
