# DESIGNER_UI_SPEC — autonomous build spec (for /goal)

GOAL: Build the approved Custom Designer UI Enhancement on branch `feature/designer-ui-enhance`.
Companion docs (read first): `.claude/plans/feature-designer-ui-enhance.md`,
`docs/temp/designer-ui-handoff.md`, and the approved visual bar
`docs/temp/designer-ui-mockup-approved.html` (open in the CDT browser). This spec adds the
transcript-provable EXIT CRITERIA the goal evaluator needs.

## CURRENT STATE (do not rediscover)
- Isolated worktree at `..\yls.worktrees\feature-designer-ui-enhance`; the main `yls/` tree runs a
  separate `/goal` and shares the local Supabase Docker DB. Touching the DB schema or the main tree
  corrupts that work.
- Designer is theme-patchwork today: `designer-header.tsx` is theme-aware; `designer-workspace-sidebar.tsx`
  is hardcoded dark (`bg-slate-950/900`, no `dark:`); only 6/19 designer files use `dark:`.
- Gates available: `npm run typecheck:ui`, `npx mocha <file>`, `npm run build`, per-file `npx eslint`.
  Repo-wide `npm run lint` is NOT a gate (~743 pre-existing errors).
- Designer is auth-gated; login approach in `docs/temp/designer-verification-auth.md`.

## HARD CONSTRAINTS (must hold at every checkpoint)
1. UI-only. **NO DB schema changes, NO migrations, no `supabase db reset`.** If something seems to
   need one, STOP and write the blocker to `docs/temp/designer-ui-BLOCKED.md`.
2. Stay inside this worktree. Never run git against the main `yls/` tree. Dev server on a **free,
   non-3010 port** (3010 belongs to the other session).
3. Every changed/added source file **≤350 LOC**; TypeScript strict, no `any`; follow existing
   patterns; no FPD.
4. Invoke the **frontend-design** skill before writing any UI (P1). Match the approved mockup bar.
5. Verify in **chrome-devtools MCP** only (never Playwright). Leave the browser open.

## PHASES (complete in order; each ends with a checkpoint commit)

### P0 — Setup
EXIT CRITERIA (prove in transcript):
- `git rev-parse --show-toplevel` shows the worktree path AND `git branch --show-current` = `feature/designer-ui-enhance`.
- `/git-workflow-planning:start feature designer-ui-enhance` run; it attaches to the existing branch (show output).
- Dev server started in background on a free non-3010 port (show the port in the log) and reachable.
- `frontend-design` skill announced as invoked.

### P1 — Design system + global chrome + theme coherence
NOTE on sequencing: design-system-first means P1 delivers the tokens/primitives and makes the
**chrome + shared foundation** theme-coherent. Each later zone phase (P2–P5) makes ITS OWN panel
surfaces theme-coherent as it is rebuilt on the primitives — so total theme coverage is reached by
P6, not crammed into P1 (which would mean refactoring the same files twice).
EXIT CRITERIA:
- New `components/designer/ui/` files exist: `designer-tokens.ts` + shared primitives (DesignerPanel,
  PanelSection, FieldRow, IconButton, ToolbarButton, SegmentedControl) — show via `git status`/`ls`.
- The CHROME + shared foundation are theme-coherent: `designer-header.tsx`, the sidebar content-panel
  shell (`designer-workspace-sidebar.tsx`), and the inspector foundation (`inspector/inspector-styles.ts`,
  `inspector/inspector-section.tsx`) no longer use bare dark-only surfaces — they use semantic tokens
  (`bg-card`/`bg-background`/`border-border`/`text-foreground`/`text-muted-foreground`). The icon rail
  stays fixed-dark by design (brand). Show via grep/diff.
- `npm run typecheck:ui` exits 0 (run it). Per-file `npx eslint` clean on every changed file (run it).
- CDT: `/design/customize` loads in BOTH light and dark; a screenshot is captured for each; agent
  states how the chrome matches the approved mockup (and notes which per-zone surfaces are still
  pending their phase).
- `/git-workflow-planning:checkpoint 1 design-system-and-chrome` commit exists (show `git log -1`).

### P2 — Inspector upgrades (zone 7)
EXIT CRITERIA: inspector rebuilt on primitives with size/color presets, recent colors, collapsible
grouped sections; typecheck:ui 0; per-file eslint clean; CDT both-theme screenshots of the inspector;
checkpoint 2 commit shown.

### P3 — Canvas toolbar (zone 1) + alignment/distribute (zone 2)
EXIT CRITERIA: floating zoom %/slider + fit + select/pan toggle present; align/distribute for
selection vs page; **pure alignment math has a co-located `*.test.ts` and `npx mocha` on it passes
(show output)**; typecheck:ui 0; per-file eslint clean; CDT both-theme screenshots showing the
toolbar; checkpoint 3 commit shown.

### P4 — Asset library (zone 3) + template gallery (zone 6)
EXIT CRITERIA: client-side search/filter over existing images + drag-to-upload affordance + polished
thumbnails (uses existing `useDesignerImages`, no new endpoint); mini-canvas template previews from
`designer-templates.ts` with category grouping (no schema change); typecheck:ui 0; per-file eslint
clean; CDT both-theme screenshots; checkpoint 4 commit shown.

### P5 — Visual merge-field picker (zone 4)
EXIT CRITERIA: menu inserts tokens (`{{first_name}}` etc.) into text elements using existing
`merge-fields.ts`/token engine; typecheck:ui 0; per-file eslint clean; CDT both-theme screenshot of
the picker in use; checkpoint 5 commit shown.

### P6 — Final polish + verification
EXIT CRITERIA:
- Full CDT visual pass across all zones in BOTH themes; screenshots captured.
- A grep confirms no non-rail designer surface remains hardcoded dark-only (every zone fixed its own
  surfaces in its phase; the icon rail is the only intentional fixed-dark surface).
- `npm run build` exits 0 (run it). `npm run typecheck:ui` exits 0. All designer mocha tests pass.
- Every changed/added source file ≤350 LOC — prove with a line-count over the changed file list.
- Contrast/a11y notes recorded.
- `/git-workflow-planning:checkpoint 6 final-polish` commit exists (show `git log`).

## DEFINITION OF DONE
All P0–P6 EXIT CRITERIA met and evidenced in the transcript, in order; `typecheck:ui` 0 and `build` 0
at P6; designer mocha tests green; all changed source files ≤350 LOC (shown); CDT light+dark
screenshots captured each phase; checkpoints 1–6 committed. THEN STOP and request owner visual review
+ explicit approval before `/git-workflow-planning:finish` (the plan says ask before merge). Do NOT
self-certify subjective "looks professional"; a documented honest report of which criteria passed or
failed also satisfies the goal. Do not curve-fit gates (e.g. don't disable eslint/types to pass).
