# yls brain — STATE
Updated: 2026-05-18

## Current focus
YLS Brain **knowledge-layer** design (user task: "brain learns the entire
app — purpose, all features, plans for unbuilt features"). Brainstorm
converged: Approach A, **lean 4-doc** scope (orientation + superseded
ledger + code-verified features + roadmap), memory-overrides-docs,
codebase-verified build status, living-via-consolidation. Spec not yet
written. Branch: direct to `develop`.

## Latest synopsis
Mid-brainstorm on the knowledge layer. Detour completed first: fixed a
cwd-fragile brain hook launch-path bug (`f69508e` — all 3 hooks now
`$CLAUDE_PROJECT_DIR`-anchored, verified). See [[journal/2026-05-18]] [02:28].

## Open threads
- Knowledge-layer spec: write to spec doc → self-review → user review →
  writing-plans. Lean 4-doc scope agreed.

## Active skills in play
- [[skills/build-safe-destructive-git]] — before any git delete/drop/reset
- [[skills/testing-red-green-verifier-gates]] — gating non-Mocha deliverables

## Notes
- Brain hook **launch** paths must be `$CLAUDE_PROJECT_DIR`-anchored
  (fixed `f69508e`); a persisted shell `cd` otherwise breaks Stop-hook
  resolution. Vault-root resolution itself is already cwd-robust
  (`brain-lib.js` `ylsRoot` → `input.cwd`/`__dirname`).
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
