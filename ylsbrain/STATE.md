# yls brain — STATE
Updated: 2026-05-18

## Current focus
**Portable `_brain` system BUILT; YLS is now instance #1.** External repo
`C:\Users\rob\Documents\Software\_brain\` holds the engine/CLI/tests
(instance #0 dogfooded). YLS adopted via `brain sync` (`ef9b5be`) — runs the
shared engine, vault content byte-unchanged, `ALL VERIFY GREEN`. Only Phase 7
left: `_brain` README + `_brain/CLAUDE.md` + final `brain test` + tag
`v0.1.0` (all in the `_brain` repo, not YLS). Knowledge layer still SHIPPED
(49 BUILT / 12 PARTIAL / 3 UNVERIFIED — read [[knowledge/orientation]] first).

## Latest synopsis
Built the portable Project Brain System end-to-end (subagent-driven, ~12
defects caught by controller/gate review) and adopted YLS as instance #1
(isolated-copy gate first; content preserved; behavioral smoke GREEN). YLS
engine is now sync-managed from `_brain`. See [[journal/2026-05-18]] [20:56].

## Open threads
- **`_brain` Phase 7 (in `_brain` repo, NOT YLS):** README + `_brain/CLAUDE.md`
  + `brain test` ALL GREEN + tag `v0.1.0`. Then onboarding other projects =
  `brain init <repo>` (explicit follow-up, out of v1 scope).
- **YLS engine is sync-managed:** never hand-edit `yls/.claude/hooks/*`
  (a `brain sync` would flag it as a local-mod). Upgrades flow from `_brain`.
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
