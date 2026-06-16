# Designer Postage Areas — Build Report (P0–P5)

Branch `feature/designer-postage-areas` (off merged `main` @ 32d9f8b), built autonomously via `/goal`
against `docs/DESIGNER_POSTAGE_SPEC.md`. UI-only (no DB schema changes). Status: **all phases
implemented and gate-verified; awaiting owner visual review before PR.**

## What shipped, by phase
- **P1 — Model + remove Address.** New `postage` element type (`kind: stamp|indicia`) + pure
  `components/designer/postage.ts` (defaults, rectsOverlap, availablePostageKinds, defaultPostagePosition,
  violatesKeepClear) with mocha tests. Removed the Address Area entirely and de-zoned Indicia: dropped
  address+indicia from SpecRects/specRectsPx, the print-overlay boxes, the obsolete preflight clear-zone
  check, and the help legend. (`1836bb0`)
- **P2 — Modules + singleton.** "Postage" tool tab with Stamp Area + Indicia Area cards; createModuleElement
  builds a locked-by-default labelled element; render-element draws the keep-clear box (STAMP/INDICIA).
  availablePostageKinds gates the cards: once one exists, both hide and a singleton/mutual-exclusion note
  shows (one stamp OR indicia per piece). (`942417d`)
- **P3 — Keep-clear.** No other element may overlap a postage box: onDragStop/onResizeStop revert on
  violation; onDrop rejects dropping onto a postage box. Labels + locked-default confirmed. (`5cc2c2d`)
- **P4 — Guarded delete.** Reusable ConfirmDialog; every delete path (keyboard, layers, canvas) routes
  through a guard — postage deletes require explicit confirmation; others delete immediately. (`002c90d`)

## Requirements coverage (all owner-confirmed)
- Address Area removed ✓ · Stamp + Indicia movable elements, separate sizes ✓ · addable from Module menu ✓
- Guarded delete (confirm dialog) ✓ · Singleton + mutually exclusive (one stamp OR indicia) ✓
- Locked by default ✓ · On-canvas STAMP/INDICIA labels ✓ · Keep-clear / no-overlay ✓
- Out of scope (declined): USPS clearance preflight, snap-to-position.

## Verification (evidence)
- `npm run typecheck:ui` → 0
- `npx mocha` → **193 passing** (incl. postage helpers: overlap, singleton, keep-clear, placement)
- `npm run build` → **exit 0**; `/design/customize` builds (66.6 kB / 278 kB)
- All changed source files ≤ 350 LOC (max: page.tsx 301, canvas-area 297)
- chrome-devtools, verified:
  - Place Stamp → labelled locked box; Postage tab then shows singleton note, no cards (light + dark)
    — `docs/temp/p2-postage-{light,dark}.png`
  - Place Indicia (dark) → renders; with one placed, both cards hidden (mutual exclusion both ways)
    — `docs/temp/p5-indicia-dark.png`
  - Keep-clear: dragging COMPANY NAME onto the STAMP snaps it back (no overlap) — `docs/temp/p3-keepclear-light.png`
  - Guarded delete: Delete opens "Remove this postage area?"; Cancel keeps, Remove deletes — `docs/temp/p4-delete-guard-light.png`
- Repo-wide `npm run lint` intentionally NOT a gate (~743 pre-existing errors); per-file eslint clean on all changed files.

## Notes for review
- Postage sizes are documented approximations (stamp 96×108, indicia 150×75 at DESIGN_PPI=100); ops should
  validate against the USPS DMM before production print (isolated in `postage.ts`).
- Objective gates are green; subjective polish is the owner's call — stops here for visual review.
  Suggested next step: `/git-workflow-planning:finish` (PR) once approved.
