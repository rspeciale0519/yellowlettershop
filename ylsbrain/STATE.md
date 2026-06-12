# yls brain — STATE
Updated: 2026-06-12

## Current focus
**Brain reconcile + consolidation DONE (2026-06-12)** — features.md Design
rows re-audited against code (58 modules verified; pdf-lib preview confirmed
non-stub) → `status: current`, BUILT 49→54; roadmap.md dossier-citation nit
fixed; index refreshed. Next up (user-stated): **comprehensive audit of all
active dev docs** to map done vs unbuilt + recommendations — treat
[[knowledge/features]] + [[knowledge/superseded]] as ground truth over stale
`dev-docs/`. Prior: released `develop` → `main` (merge `91fcb60`; artwork
designer overhaul + `_brain` v0.1.0 + knowledge layer all on production
main). Read [[knowledge/orientation]] for context.

## Latest synopsis
Reconciled the standing `needs-reconcile` on features.md: verified the
designer surface in code (canvas/inspector/preflight/preview/tokens, 58
modules; `app/api/design/preview` real pdf-lib, no stubs), rewrote Design
rows (5→10 BUILT), updated counts, fixed roadmap.md self-containment nit.
No app code changed. See [[journal/2026-06-12]].

## Open threads
- **Designer deferred follow-ups** (documented, tracked): true CMYK/PDF-X
  export, embedded handwriting TTF (families map to pdf-lib StandardFonts),
  order↔designer `orderId`-on-save linkage, broader WCAG contrast sweep,
  Tooltips on canvas zoom toolbar, **chrome-devtools visual regression NOT
  yet run** (auth-gated; approach in
  `docs/temp/designer-verification-auth.md`) — designer UI is *unverified*
  visually, only logic+build are evidenced.
- **Pending user task: comprehensive done-vs-unbuilt audit + recommendations**
  across active dev docs ([[knowledge/roadmap]] PARTIAL/UNVERIFIED rows are
  the starting backlog).
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
