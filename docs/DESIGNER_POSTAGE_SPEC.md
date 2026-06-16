# DESIGNER_POSTAGE_SPEC — autonomous build spec (for /goal)

GOAL: Build the Designer Postage Areas feature on branch `feature/designer-postage-areas`. Full
scope + rationale: `.claude/plans/feature-designer-postage-areas.md` (read it first). This spec adds
the transcript-provable EXIT CRITERIA the goal evaluator needs.

## CURRENT STATE (do not rediscover)
- Worktree off `main` @ 32d9f8b — already contains the merged designer UI design system
  (`components/designer/ui/` tokens + primitives, theme-coherent inspector/panels/canvas). REUSE it.
- Single-element selection model. Stamp/Indicia are postal-compliance elements: separate, different
  default sizes; the Address Area must be removed.
- Gates: `npm run typecheck:ui`, `npx mocha <file>`, `npm run build`, per-file `npx eslint`.
  Repo-wide `npm run lint` is NOT a gate (~743 pre-existing errors).
- Designer is auth-gated; cookie auth is shared across localhost ports.

## HARD CONSTRAINTS (hold at every checkpoint)
1. UI-only. **NO DB schema changes / NO migrations / no `supabase db reset`.** If one seems needed,
   STOP and write `docs/temp/designer-postage-BLOCKED.md`.
2. Stay in THIS worktree; never run git against the main `yls/` tree. Dev server on a **free,
   non-3010 port**.
3. Every changed/added source file **≤350 LOC**; TS strict, no `any`; reuse `components/designer/ui/`
   primitives; no FPD.
4. Invoke **frontend-design** before UI. Verify in **chrome-devtools** (never Playwright), light+dark.

## PHASES (in order; each ends with a checkpoint commit)

### P0 — Setup
EXIT: `git rev-parse --show-toplevel` = the postage worktree AND `git branch --show-current` =
`feature/designer-postage-areas`; `/git-workflow-planning:start feature designer-postage-areas` run;
dev server up on a free non-3010 port (port shown); frontend-design announced.

### P1 — Model + remove Address + pure helpers
EXIT:
- A postage element model exists (one type with `kind: 'stamp'|'indicia'` OR two types) with default
  sizes + `locked` default; show via `git status`/diff.
- The **Address Area is gone**: a grep for the address zone/box shows it removed from `mail-spec.ts`
  / `print-overlay.tsx` (no placeable address box remains).
- Pure helpers with co-located mocha tests in `tests/designer/`: (a) **overlap/intersection** test
  (does a box intersect a postage box), (b) **singleton/mutual-exclusion** availability (given
  current elements, which of stamp/indicia may be added). `npx mocha` → passing (show output).
- `npm run typecheck:ui` 0; per-file eslint 0. Checkpoint 1 commit (show `git log -1`).

### P2 — Module menu (add Stamp / Indicia)
EXIT: Module menu shows **Stamp Area** + **Indicia Area** entries; availability enforces singleton +
mutual exclusivity (once one exists, the others are hidden/disabled — verify in CDT). Adding places a
locked, labelled element. typecheck:ui 0; eslint 0; CDT both-theme screenshot; checkpoint 2.

### P3 — Canvas behavior (keep-clear + labels + locked)
EXIT: on-canvas **"STAMP"/"INDICIA" labels** render; new elements start **locked**; **keep-clear**:
dropping a module onto, or dragging an element over, a postage box is rejected/blocked (the other
element cannot overlap) — demonstrated in CDT (attempt overlap → element does not end up on top).
typecheck:ui 0; eslint 0; CDT both-theme screenshots; checkpoint 3.

### P4 — Guarded delete
EXIT: deleting a Stamp/Indicia element opens a **confirmation dialog requiring explicit approval**
(shared confirm component); cancel keeps it, confirm removes it — both shown in CDT. Non-postage
elements delete without the dialog. typecheck:ui 0; eslint 0; checkpoint 4.

### P5 — Polish + verification
EXIT: full CDT pass in BOTH themes (place stamp, place indicia blocked while stamp exists or vice
versa, move, overlap-rejected, delete-guard); `npm run build` exit 0; `npm run typecheck:ui` 0; all
designer mocha tests pass; every changed source file ≤350 LOC (prove by line count); checkpoint 5.

## DEFINITION OF DONE
All P0–P5 EXIT CRITERIA met + evidenced in the transcript, in order; build 0, typecheck:ui 0, mocha
green at P5; all changed files ≤350 LOC (shown); CDT light+dark evidence per phase; checkpoints
1–5 committed. THEN STOP and request owner visual review before `/git-workflow-planning:finish`. Do
NOT self-certify subjective polish; an honest report of which criteria passed/failed also satisfies
the goal. Do not disable eslint/type/test gates to pass.
