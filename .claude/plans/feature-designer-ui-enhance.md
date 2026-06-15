# Plan — Custom Designer UI Enhancement

**Type:** feature · **Subject:** designer-ui-enhance · **Branch:** `feature/designer-ui-enhance` (off `main`)
**Isolation:** dedicated git worktree (`../yls.worktrees/`) — must NOT touch the running goal on `feature/permission-resource-picker`.

## Goal

Elevate the custom designer (`/design/customize`) to look and feel like it was built by a
professional graphic artist — Direction A (evolve the existing identity), made **theme-coherent**
across light + dark, plus six targeted functional upgrades. Approved visual bar: the
`polished-bar.html` mockup (both themes) from the brainstorming session.

## Approach

**Design-system-first, then zones.** Establish a small theme-aware designer design-system layer
(tokens + shared primitives), apply it to the global chrome, then rebuild each zone on top so the
polish is consistent by construction rather than per-panel.

## Scope (in)

Functional zones (from scoping): **1** on-canvas zoom/pan/fit toolbar, **2** alignment & distribute
tools, **3** asset-library UX (search + upload), **4** visual merge-field picker, **6** template
gallery (richer previews + categories), **7** inspector upgrades (presets, collapsible groups,
recent colors). Plus the **polish backbone** and **full theme coherence** across all designer
surfaces.

## Scope (out / deferred)

- Zone **5** preflight quick-fix buttons; zone **9** print-zone legend/toggles — deferred.
- No true CMYK/PDF-X export, embedded handwriting TTF, order↔designer linkage (existing backlog).
- **No DB schema changes, no migrations** — every zone uses existing endpoints/data.

## Hard constraints

- **UI-only — zero schema changes / no migrations.** Protects the shared local Supabase DB used by
  the concurrently-running goal. If something seems to need a schema change, STOP and ask.
- Worktree off `main`; dev server on a **free, non-3010 port**; never touch
  `feature/permission-resource-picker`, its tree, or its port.
- All source files **≤350 LOC**; TypeScript strict, no `any`; follow existing patterns.
- **`frontend-design` skill applied** during the build. Professional graphic-artist quality is the bar.
- No FPD — custom design system only.
- Verify in-browser with **chrome-devtools MCP** (never Playwright). Designer is auth-gated — use the
  approach in `docs/temp/designer-verification-auth.md`. Leave the browser open for review.

## Design-system layer (foundation)

New `components/designer/ui/`:
- `designer-tokens.ts` — typed class constants: type scale, spacing rhythm, radii, **theme-aware**
  color pairs (light/dark) for the slate + yellow-400 palette, elevation/shadow steps, one shared
  focus-ring + hover/active recipe. No more hardcoded `bg-slate-900` without a `dark:`/light pair.
- Shared primitives (each ≤350 LOC): `DesignerPanel`, `PanelSection` (evolves
  `inspector/inspector-section.tsx`), `FieldRow` (evolves `inspector/inspector-styles.ts`),
  `IconButton`, `ToolbarButton`, `SegmentedControl` (evolves `inspector/fields/toggle-group-field.tsx`),
  refined button variants.
- Extends — does not replace — existing `inspector/fields/*`. Behavior preserved; surface elevated.

**Theme-coherence note:** the workspace sidebar (`designer-workspace-sidebar.tsx`) is currently
hardcoded dark (`bg-slate-950/900`, no `dark:`), while the header is theme-aware — so light theme
looks like a patchwork today. Fixing this is part of P1. Brand dark icon rail is retained in BOTH
themes by design.

## Phases (each ends with `/git-workflow-planning:checkpoint <n> <desc>`)

- **P1 — Design system + global chrome.** Tokens + primitives; apply to header, icon rail, panel
  shells; make every designer surface theme-coherent (light + dark). Visible transformation even
  before zone work.
- **P2 — Inspector upgrades (zone 7).** Rebuild inspector panels/fields on primitives; size/color
  presets; recent colors; collapsible grouped sections.
- **P3 — Canvas toolbar (zone 1) + alignment/distribute (zone 2).** Floating zoom %/slider, fit,
  select/pan toggle; align/distribute for selection vs page. Pure alignment math gets Mocha tests.
- **P4 — Asset library (zone 3) + template gallery (zone 6).** Client-side search/filter over
  existing images, drag-to-upload affordance, polished thumbnails (existing `useDesignerImages`);
  mini-canvas template previews rendered from `designer-templates.ts`, category grouping.
- **P5 — Visual merge-field picker (zone 4).** Insert tokens from a menu into text elements using
  existing `merge-fields.ts` / token engine.
- **P6 — Final polish + verification.** Full CDT visual pass across all zones in both themes;
  contrast/a11y sweep; reconcile any cross-zone inconsistency.

## Verification (per checkpoint)

- Per-zone chrome-devtools MCP visual check (light + dark) against the approved bar.
- Pure-logic helpers (alignment math, preview rendering) → co-located Mocha `.test.ts`.
- Gates: per-file `eslint` clean + `npm run typecheck:ui` 0 at each checkpoint. Repo-wide `npm run
  lint` is NOT a gate (~743 pre-existing errors — separate lint-debt backlog).

## Git workflow

After plan approval: create worktree off `main`, then `/git-workflow-planning:start feature
designer-ui-enhance`, `checkpoint` after each phase (update roadmap first per Rule 7), `finish` at
the end (PR → asks before merge).

## Open questions / risks

- Worktree + slash-command interaction: the planning commands act on the worktree's working dir;
  confirm `start` switches to the pre-created branch cleanly.
- `frontend-design` skill is invoked at the start of P1 (first UI work), not during planning.
