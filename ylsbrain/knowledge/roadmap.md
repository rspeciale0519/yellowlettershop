---
kind: knowledge
slug: roadmap
status: current
updated: 2026-05-18
layer: roadmap
sources:
  - dev-docs/roadmap.md
  - dev-docs/todo.md
---

# Roadmap — reconciled unbuilt work

Reconciles the April-2025 plan to the current transactional direction. Items the code already delivers are removed (see [[knowledge/features]]); killed strategy is in `## Superseded / dropped`. Original phase-by-phase detail lives in `dev-docs/roadmap.md` (6 phases + todo.md Phases 7–10 ongoing) — this is the live, deduped view only.

## Near-term

- **Promote AccuZip validation from simulated → live.** Replace `Math.random()` job path with real API calls when key/path confirmed (`app/api/accuzip/upload/route.ts:135`). Flagged: [[knowledge/superseded]] F1.
- **Distributed rate limiting.** Replace in-memory limiter with shared store (dossier §B PARTIAL).
- **User orders dashboard → real data.** Replace mock `lib/data-structures.ts` read with live queries; admin orders is already real ([[knowledge/superseded]] F5).
- **Template gallery → DB-backed.** Unify static `data/templates-data.ts` browse with the partial `mail_templates` DB path ([[knowledge/superseded]] F4).

## Mid-term

- **MelissaData list-purchase + payment wiring.** Add purchase route and payment integration; current code hardcodes $0.10/record with no buy flow ([[knowledge/superseded]] F2).
- **Mailgun outbound / transactional email.** Build send path; only inbound webhook parsing exists today ([[knowledge/superseded]] F3).
- **Notification settings backend + API-keys page.** Back the existing UI shells (dossier §B PARTIAL/UNVERIFIED).
- **Project-level RBAC clarification.** Define scope and add the missing `projects` table/migrations (dossier §B UNVERIFIED).
- **Security / 2FA page.** Verify and complete (dossier §B UNVERIFIED).

## Long-term

- **Redstone integration.** Doc-only today (`dev-docs/api-redstone.md`, 2622 lines, zero code refs) — scope before committing.
- **AI features (OpenAI/Anthropic).** Keys present via MCP, no app wiring — define product use before building.
- Remaining `dev-docs/roadmap.md` Phases 7–10 (todo.md ongoing) to be reconciled against the transactional model before scheduling.

## Superseded / dropped

- **Subscription tiers & plan-gating (Free/Pro/Team/Enterprise).** Dropped — transactional only, MLM separate app. → see [[knowledge/superseded]] D1.
- **Fancy Product Designer (FPD) integration.** Dropped — custom in-house designer shipped. → see [[knowledge/superseded]] D2.
- **8-tier / 4-role permission model.** Dropped — code is `admin|super_admin` only. → see [[knowledge/superseded]] D5.
- **Per-record AccuZip billing + plan free-quotas.** Dropped — tiered per-job pricing, free with mail orders. → see [[knowledge/superseded]] D3.
- **Admin pricing UI (was a future phase).** Already delivered, not roadmap work. → see [[knowledge/superseded]] D4.
