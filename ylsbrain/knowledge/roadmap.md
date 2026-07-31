---
kind: knowledge
slug: roadmap
status: current
updated: 2026-07-31
layer: roadmap
sources:
  - dev-docs/implementation-status.md
  - dev-docs/roadmap.md
  - dev-docs/todo.md
  - docs/temp/yls-feature-audit-report.md
---

# Roadmap — reconciled unbuilt work

Live deduped view (2026-07-31 audit). Delivered items removed — see
[[knowledge/features]]. Killed strategy in `## Superseded / dropped`.

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
- **Wire the DB-backed rate limiter** (built, zero callers) into login/sensitive
  routes; retire the in-memory Map.
- **Middleware/auth hardening** — extend matcher beyond `/dashboard/*`; wrap
  bare payment + mailing-list + `/api/teams/*` handlers; fix
  `analytics/performance` IDOR; delete shipped test/debug endpoints.
- **Template gallery → DB-backed** (both galleries mock; `mail_templates`
  unmigrated).

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
  mail-tracking add-on, Redstone (doc-only), onboarding, discount codes.
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
