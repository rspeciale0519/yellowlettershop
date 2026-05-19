# yls brain — STATE
Updated: 2026-05-19

## Current focus
None active — clean. **Portable `_brain` system v0.1.0 SHIPPED** (instance #0
`_brain/` dogfooded; YLS = instance #1 via `brain sync` `ef9b5be`, vault
byte-unchanged, `ALL VERIFY GREEN`, tag `v0.1.0`). **Knowledge layer fully
reconciled** — `[[knowledge/superseded]]` F1–F5 **CONFIRMED 2026-05-19**
(user-confirmed; no provisional items remain). Read [[knowledge/orientation]]
first for whole-app context (49 BUILT / 12 PARTIAL / 3 UNVERIFIED).

## Latest synopsis
Added global **Rule 11** to `~/.claude/CLAUDE.md` (user-authorized): every
session in any repo now self-discovers `_brain` + auto-honors an installed
brain, but never proactively offers to bootstrap (option a — passive,
user-initiated). Cross-repo discovery gap closed. See [[journal/2026-05-19]]
[23:41]. (Prior: F1–F5 CONFIRMED [21:26]; `_brain` build + YLS adoption
[[journal/2026-05-18]] [20:56]/[21:00].)

## Open threads
- (clean) Project Brain System v0.1.0 shipped (instances #0 `_brain`, #1 YLS);
  knowledge layer fully reconciled — F1–F5 CONFIRMED 2026-05-19 (no provisional
  items remain). Awaiting next task.
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
