---
kind: knowledge
slug: roadmap
status: current
updated: 2026-08-02
layer: roadmap
sources:
  - dev-docs/implementation-status.md
  - dev-docs/roadmap.md
  - dev-docs/todo.md
  - docs/temp/yls-feature-audit-report.md
---

# Roadmap — reconciled unbuilt work

Live deduped view (2026-07-31 audit, release delta 2026-08-02). Delivered items
removed — see [[knowledge/features]]. Killed strategy in
`## Superseded / dropped`.

> **2026-08-02: the fulfillment work is in production** (`main` @ `1cbc0ee`,
> migrations applied to the hosted project). The near-term list below is what
> remains *after* that release.

## Near-term (correctness for launch)

- ~~**`payment_transactions` migration**~~ **DONE 2026-07-31** (`feature/vendor-fulfillment`
  Phase 1): refactored all 6 referencing files to the inline-on-orders model
  instead of adding the table. Revenue/capture/refund now persist and aggregate
  on `orders`; migration `20260801000000` added `captured_at`/`amount_refunded`/
  `refunded_at` + the missing `cancelled` enum value. Zero live
  `payment_transactions` queries remain.
- ~~**Admin order-service schema fix**~~ **DONE 2026-07-31** — `created_by` +
  batch profile load (no FK join path); `user-service` drift (`order_state`,
  `user_id`) fixed too; dead bare `capture-payment`/`refund-payment` routes
  archived.
- ~~**Vendor fulfillment hand-off**~~ **DONE 2026-07-31** (branch
  `feature/vendor-fulfillment`): auto-dispatch after capture → vendor emailed
  proof + recipient CSV (signed, 7-day) → admin advances accepted/in-production/
  mailed(+tracking)/delivered → order completes, customer emailed on ship.
  `lib/fulfillment/`, `order_dispatches`, admin dispatch API + panel.
  Live-verified against the local DB (transitions, order advance, tracking,
  backwards-refusal). Remaining: inbound vendor replies are still manual.
- ~~**PR #24 review fixes**~~ **DONE 2026-08-02** — 8 ultrareview findings + 1
  self-found, all verified real before acting: cross-tenant PII IDOR on the
  dispatch path, CWE-1236 CSV formula injection into the vendor spreadsheet,
  cumulative-`amount_refunded` overwrite, partial refunds mislabelling
  `payment_status` **and cancelling the order**, race 500→409, jsonb package
  overwrite, and a 426→264-line split of `dispatch-service.ts`. None had
  shipped, so nothing was ever customer-exposed. `implementation-status.md` §3b.
- **Wire the DB-backed rate limiter** (built, zero callers) into login/sensitive
  routes; retire the in-memory Map.
- **Middleware/auth hardening** — extend matcher beyond `/dashboard/*`; wrap the
  remaining bare handlers (`payments/create-payment-intent`, `mailing-lists/*`,
  `/api/teams/*`); fix `analytics/performance` IDOR; **delete the shipped
  test/debug endpoints** (`api/test-db`, `api/test-db-verification`,
  `api/test-auth-state`, `/test-types`) — these are now live in production,
  which moves this up the list.
- **Template gallery → DB-backed** (both galleries mock; `mail_templates`
  unmigrated).
- **Post-release smoke against production** — the whole fulfillment path has
  only ever been exercised against the local stack; it has never run against the
  hosted DB with real Stripe.

## Mid-term

- Proof **annotation** UI (PRD §3.10; `proof_annotations` table exists, 0 refs).
- Melissa list-purchase + payment wiring (client exists; wizard says
  "coming soon").
- Skip-trace completion or removal (webhook no-op).
- Drafts autosave activation; activity page real data; in-app notification
  center decision; undo/redo beyond one resource type.
- Duplicate-stack consolidation (`/api/team` vs `/api/teams`, payment services,
  tags UIs, signup/register); archive dead subscription code.
- D9 vendor-gated capture + D1 per-recipient pURL generation (both depend on
  fulfillment/vendor loop).

## Long-term / needs owner input

- D2 AI copy, D10 AI proof comparison (AI Gateway; keys exist, no wiring).
- D5 win-back emails (needs scheduler), D6 CallRail (needs owner OAuth creds —
  `memory:project_callrail_integration`), D8 checkout deliverability score.
- Report builder / scheduled reports, NPS/feedback, admin impersonation,
  mail-tracking add-on, onboarding, discount codes.
- **Redstone**: outbound `createOrder` is BUILT and opt-in; blocked on Redstone
  confirming our endpoint is provisioned (outreach email sent 2026-08-02,
  awaiting reply). Inbound status/tracking webhooks (Phase 3) cannot start until
  they answer. `implementation-status.md` §8b.
- Owner-provisioned env: `ACCUZIP_API_KEY`, `MELISSA_DATA_API_KEY`, prod email
  key, CallRail creds (`docs/temp/production-blockers.md`).
- **New UI ("Masthead") rollout** — direction chosen 2026-07-10, exploratory
  branches only; nothing merged (`docs/temp/NEW_UI_DIRECTION_CHOICE.md`).

## Superseded / dropped

- Subscriptions/plan-gating → transactional only ([[knowledge/superseded]] D1).
- FPD → custom designer shipped (D2).
- 8-tier/4-role model → admin|super_admin + per-team Owner/Admin/Member (D5;
  team roles delivered 2026-06-16).
- Per-record AccuZip billing → tiered per-job (D3).
- Admin pricing UI → delivered (D4).
