# yls brain — STATE
Updated: 2026-06-13

## Current focus
**Production-readiness: DB consolidation DONE+verified; orders/payment refactored
to the consolidated model; core flow browser-smoke VERIFIED.** Branch
`feature/production-readiness`, commits `0940942`→`7517c40`. Big arc this session:
(1) DB consolidation — DB1 normalized domain model built into the YLS-OWNED
project DB2 (`lmtpfgfulkynrktdkgpu`), 33 tables, data preserved, team-scoped RLS
(`0a1f088`); (2) 5 security fixes incl. PII-exposure RLS inherited from DB1
(`50d383e`) + submit payment re-verify (`a8842c0`); (3) orders+payment code
refactored to normalized/inline-payment model (`cb6f94b`,`52c7353`) — no more
order_state blob / payment_intents tables; (4) `withAuth` cookie-session fix;
(5) **chrome-devtools browser smoke on real DB2** — login→dashboard→orders→
status page verified (`docs/temp/smoke/*.png`). **NEW (fd726fe,011afe9):**
typecheck:ui backlog CLEARED 14→0; **B8 type-debt reconciled 664→0**; **full
wizard browser-smoke DONE** — journey verified login→…→Step 6 payment, 9 real
bugs fixed live (auto-map, AccuZip upload contract, design-save table, designer
cross-tab round-trip, campaign defaults, proof buckets ×2) + migrations
20260613030000+040000 APPLIED to DB2 + design-previews bucket auto-created.
Gates: typecheck:ui 0, typecheck:full 0, 143 tests, build 0. **CHECKOUT NOW
CLOSED END-TO-END (commit `4048a7e`):** drove a $1.48 / 10-piece order through
the wizard → authorize (manual-capture PI) → submit → proof PDF → approve →
**CAPTURE** ($1.48, order 1065B687 → processing/captured on DB2). Fixed 2 real
bugs: stale-state submit (submitOrder/validateCurrentStep closed over pre-update
orderState → "Payment must be authorized" on every checkout; now take a state
override) + approve 500 (wrote nonexistent `orders.updated_at`; removed + made
capture idempotent so a post-capture DB hiccup self-heals). Detail in
[[journal/2026-06-13]] [13:58]. REMAINING: Phases 4-7 + D1-D10; deploy; set email
provider keys (prod); persist large uploaded CSVs to mailing_list_records
(previewData-only today); pricing realism (flat $0.118/pc). Full summary:
`docs/temp/production-readiness-status.md`. Test user yls-e2e@yellowlettershop.test.
Read [[knowledge/orientation]].

## Latest synopsis
Shipped production-readiness Phases 0-3 (code) + 2 security fixes; resolved a
Supabase project-identity mixup. The app's real DB is `lmtpfgfulkynrktdkgpu`
(proven by anon+service JWT `ref` claims in `.env.local`), NOT the dashboard
project *named* "YLS" (`jgkkcrnegquqbizfuhqr`). Lesson: identify "which X does
this app use" from the app's own config/JWT, never an external listing's
display name. Goal paused on owner blocker (migrations + browser smoke).
See [[journal/2026-06-13]].

## Open threads
- **B8 — hidden type-debt → RESOLVED to ZERO** (`docs/temp/typecheck-debt-finding.md`):
  full-include `tsc` (`tsconfig.fullcheck.json`) 664→**0**. Root cause was a
  type-architecture swap (970-line hand-authored `types/supabase.ts` replaced by the
  generated schema at consolidation). Fixed via Phase A (canonical layer:
  `types/supabase-domain.ts` + `domain-extra.ts`), Phase B (8 parallel subagents,
  by module), Phase C (central fixes + archived never-functional scaffolding + added
  `npm run typecheck:full` gate). Gates: typecheck:full 0, typecheck:ui 0, tests 143,
  `next build` exit 0. **Wire `typecheck:full` into CI** (`ignoreBuildErrors` stays
  true — Next's build type-checker has lucide-react false-positives; tsc is authoritative).
  INCOMPLETE features archived (build later): saved-payment-methods, campaign-payment,
  asset-usage table.
- **Migration 20260613030000 committed but UNAPPLIED to live DB2** — applies at
  deploy (ad-hoc Mgmt-API prod write was correctly guardrail-denied). Until applied,
  assets-library + undo/redo throw at runtime (assets API has storage-only fallback).
- **Designer deferred follow-ups** (documented, tracked): true CMYK/PDF-X
  export, embedded handwriting TTF (families map to pdf-lib StandardFonts),
  order↔designer `orderId`-on-save linkage, broader WCAG contrast sweep,
  Tooltips on canvas zoom toolbar, **chrome-devtools visual regression NOT
  yet run** (auth-gated; approach in
  `docs/temp/designer-verification-auth.md`) — designer UI is *unverified*
  visually, only logic+build are evidenced.
- **Feature audit DONE** → `docs/temp/yls-feature-audit-report.md`
  (2026-06-12): 54 BUILT confirmed; 4 verified P0 checkout breaks (no
  `/api/orders/proof`, `calculateFinalPricing` undefined in PaymentStep,
  success page 404, submit dead-ends); 13 doc-intended NOT BUILT; 6-sprint
  build order proposed (Sprint 1 = unbreak checkout). Awaiting user
  direction on which sprint/items to start.
- Standing op-note: **YLS engine is sync-managed** — never hand-edit
  `yls/.claude/hooks/*` (a `brain sync` flags it local-mod); upgrades flow
  from `_brain`. Onboarding other projects = `brain init <repo>` (follow-up,
  out of v1 scope).

## Active skills in play
- [[skills/build-safe-destructive-git]] — before any git delete/drop/reset
- [[skills/testing-red-green-verifier-gates]] — gating non-Mocha deliverables

## Notes
- Brain hook **launch** paths must be `$CLAUDE_PROJECT_DIR`-anchored
  (fixed `f69508e`); a persisted shell `cd` otherwise breaks Stop-hook
  resolution. Vault-root resolution itself is already cwd-robust
  (`brain-lib.js` `ylsRoot` → `input.cwd`/`__dirname`).
- `dev-docs/` are an April-2025 baseline and materially STALE (revenue
  model, design engine, roles, AccuZip billing). On any app-knowledge
  question defer to [[knowledge/superseded]]; it is authoritative over
  the docs. Knowledge-layer freshness is reconciled mechanically at
  consolidation (`git log --name-only` since watermark — see CLAUDE.md).
- Known benign: AL-5 PII heuristic false-positives on 40-char git SHAs
  quoted in the journal (`[0-9a-fA-F]{40,}`); non-blocking, regex not
  tightened (deferred).
- Known benign: consolidate.js gap check perpetually flags `9e05ba0`
  (local date 2026-05-17) since journals are UTC-dated (`2026-05-18.md`) —
  artifact of the date-based-covering decision, not a real coverage gap.
- Seam: skills `provisional`; no Developer-brain promotion yet
  (promotion needs `established` + cross-project authorization — §8).
- Hazard (recorded as feedback memory): concurrent CC sessions doing git
  branch ops in one working tree caused a mid-consolidation checkout→main;
  recovered, no loss. MITIGATED: use `scripts/wt.ps1 new <branch>` for a
  per-session worktree (sibling `../yls.worktrees/`); never hand-run
  `git worktree add`. See [[concurrent-sessions-worktrees]].
