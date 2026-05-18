# yls brain — STATE
Updated: 2026-05-18

## Current focus
**Generalizing the brain** into a portable, per-project system housed in the
external repo `C:\Users\rob\Documents\Software\_brain\` (own git repo). Design
locked (7 sections); spec committed `aa02b74` →
`_brain/docs/spec-project-brain-system.md`. Next: writing-plans →
`_brain/docs/plan-project-brain-system.md`. YLS becomes **instance #1** during
implementation (a future YLS task: journal + consolidation + §11 behavioral
smoke; isolated filesystem copy first, NOT a worktree). Knowledge layer
remains SHIPPED on `develop` (49 BUILT / 12 PARTIAL / 3 UNVERIFIED — read
[[knowledge/orientation]] first).

## Latest synopsis
Brainstormed + spec'd the portable Project Brain System (vendored installer +
`sync`; one-tier + Seam stub; principle D = structure≠truth, audited
throughout). Spec is external (`_brain/` repo); no YLS code/content changed.
See [[journal/2026-05-18]] [17:44].

## Open threads
- **Portable brain system:** spec done (`_brain/` `aa02b74`); next =
  writing-plans, then implementation. Spec user-review gate pending. YLS
  instance-#1 adoption is a FUTURE YLS task (own journal + consolidation +
  behavioral smoke; isolated copy not worktree).
- **5 FLAG-TO-USER conflicts** in [[knowledge/superseded]] F1–F5 recorded
  provisionally (code-reality = truth) — await user confirmation:
  AccuZip validation simulated; MelissaData no purchase wiring; Mailgun
  outbound absent; templates static vs DB; user orders dashboard mock.

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
