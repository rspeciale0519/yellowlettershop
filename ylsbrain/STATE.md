# yls brain — STATE
Updated: 2026-06-13

## Current focus
**Production-readiness goal — Phases 0-3 SHIPPED to `feature/production-readiness`,
paused at goal escape clause (owner blocker).** Branch off develop; commits
`0940942`(plan)→`d0a151d`(security). Phase 1 unbreak-checkout, Phase 2
close-the-loop (proof→approve→capture + email layer + real AccuZip), Phase 3
hardening (webhook retry/dead-letter, payment integrity, mapping gate,
distributed rate-limit foundation) — all code-complete, `npm test` 136
passing, typecheck 0-new vs 12 baseline, build exit 0, files ≤350 LOC. Plus 2
security fixes (email HTML-injection `b3a4e16`; payment IDOR + fail-closed
rate-limit `d0a151d`). **BLOCKED on owner:** migrations unapplied + browser
smoke not run. Spec: `.claude/plans/feature-production-readiness.md`; report
`docs/temp/yls-feature-audit-report.md`; blockers `docs/temp/production-blockers.md`.
Phases 4-7 + differentiators D1-D8 remain. Read [[knowledge/orientation]].

## Latest synopsis
Shipped production-readiness Phases 0-3 (code) + 2 security fixes; resolved a
Supabase project-identity mixup. The app's real DB is `lmtpfgfulkynrktdkgpu`
(proven by anon+service JWT `ref` claims in `.env.local`), NOT the dashboard
project *named* "YLS" (`jgkkcrnegquqbizfuhqr`). Lesson: identify "which X does
this app use" from the app's own config/JWT, never an external listing's
display name. Goal paused on owner blocker (migrations + browser smoke).
See [[journal/2026-06-13]].

## Open threads
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
