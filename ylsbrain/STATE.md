# yls brain — STATE
Updated: 2026-05-19

## Current focus
**Artwork Designer Overhaul COMPLETE on branch `feature/artwork-designer-overhaul`**
(15 phases, 16 commits `618006b`→`2e45a39`, local-only — not pushed/PR'd;
awaiting user decision on Rule-8 finish). Every phase gated: full Mocha suite
green (≈72, 0 regressions), **0 new `typecheck:ui` errors vs the pre-existing
12-error baseline**, eslint clean (touched), `next build` exit 0, files ≤350
LOC. Plan: `.claude/plans/feature-artwork-designer-overhaul.md` (Rev 3, all ✅).
Prior: `_brain` v0.1.0 shipped; knowledge layer reconciled (F1–F5 CONFIRMED).
Read [[knowledge/orientation]] for whole-app context.

## Latest synopsis
Implemented review findings #2–#7 + full drag-drop + shadcn/frontend-design
pass: selectable print-accurate mail sizes w/ bleed/safe/USPS overlays, real
server-side PDF (pdf-lib), modular deep Inspector, per-page background tool,
recipient-data Preview dialog, legacy duplicate checkout editor archived →
one unified designer. See [[journal/2026-05-19]] [03:10]. Discovered+handled
two pre-existing repo breakages (absent Mocha harness; pre-RED `typecheck:ui`)
→ user-approved "fix runner + delta-gate" model. (Prior: Rule 11 [23:41];
F1–F5 CONFIRMED [21:26].)

## Open threads
- **Artwork designer overhaul: implementation done, NOT integrated.** Branch
  `feature/artwork-designer-overhaul` is local-only — user must decide push +
  PR + merge-to-develop (Rule-8 finish). Rollback = don't merge / `git revert`;
  legacy preserved under `archive/`. Documented deferred follow-ups: true
  CMYK/PDF-X, embedded handwriting TTF, order↔designer orderId-on-save,
  broad WCAG sweep, chrome-devtools visual regression (needs authed dev
  session — `docs/temp/designer-verification-auth.md`).
- (clean) Project Brain System v0.1.0 shipped; knowledge layer reconciled
  (F1–F5 CONFIRMED 2026-05-19).
- Standing op-note: **YLS engine is sync-managed** — never hand-edit
  `yls/.claude/hooks/*` (a `brain sync` flags it local-mod); upgrades flow
  from `_brain`. Onboarding other projects = `brain init <repo>` (follow-up,
  out of v1 scope). Optional housekeeping: `roadmap.md` still cites the
  disposable scratch dossier in 2 lines (self-containment nit).

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
- Seam: both skills are `provisional`; no Developer-brain promotion yet
  (promotion needs `established` + cross-project authorization — §8).
- Hazard (recorded as feedback memory): concurrent CC sessions doing git
  branch ops in one working tree caused a mid-consolidation checkout→main;
  recovered, no loss. MITIGATED: use `scripts/wt.ps1 new <branch>` for a
  per-session worktree (sibling `../yls.worktrees/`); never hand-run
  `git worktree add`. See [[concurrent-sessions-worktrees]].
