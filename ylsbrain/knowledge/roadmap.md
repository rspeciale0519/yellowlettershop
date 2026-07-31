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

- **`payment_transactions` migration** (or refactor the 6 referencing files to
  the inline-on-orders model) — admin revenue metrics/capture persistence are
  broken without it. `lib/admin/analytics-service.ts` et al.
- **Admin order-service schema fix** — `user_id` → `created_by` + join repair.
- **Vendor fulfillment hand-off** — orders dead-end at `processing` post-capture;
  routing/dispatch automation is the biggest unbuilt PRD core piece (feeds D9).
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
