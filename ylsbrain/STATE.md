# yls brain — STATE
Updated: 2026-05-18

## Current focus
None active. YLS Brain **knowledge layer SHIPPED** to `develop` (lean
4-doc: [[knowledge/orientation]] + [[knowledge/superseded]] +
[[knowledge/features]] + [[knowledge/roadmap]]; `kind: knowledge` schema
+ mechanical git-diff consolidation clause + `verify-knowledge.js` gate).
Code-verified: 49 BUILT / 12 PARTIAL / 3 UNVERIFIED. Read
[[knowledge/orientation]] first for whole-app context.

## Latest synopsis
Knowledge layer delivered end-to-end via superpowers flow (brainstorm →
spec → plan → subagent-driven build); gate GREEN, build-status
re-verified. Memory overrides the 13-mo-stale dev-docs; 5 doc-vs-truth
deltas + 5 flagged net-new conflicts ledgered. See [[journal/2026-05-18]] [13:55].

## Open threads
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
