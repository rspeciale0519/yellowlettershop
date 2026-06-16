# Plan — Designer Postage Areas (Stamp & Indicia)

**Type:** feature · **Subject:** designer-postage-areas · **Branch:** `feature/designer-postage-areas` (off `main` @ 32d9f8b, which includes the merged designer UI enhancement).
**Isolation:** dedicated worktree `../yls.worktrees/feature-designer-postage-areas`.

## Goal

Replace the fixed print-spec **Address Area** overlay with two **movable, compliance-critical design
elements** — a **Stamp Area** box and an **Indicia Area** box — that the user can place anywhere,
add from the Module menu, and only delete behind a confirmation. Builds on the merged design system
(`components/designer/ui/` tokens + primitives, the Module menu, inspector, canvas).

## Why (owner rationale)

Stamp and Indicia areas are postal/mailing-compliance elements: the piece needs a correctly placed
postage area, and the method dictates which (physical **stamp** vs printed **indicia** permit
imprint — hence two different sizes). Losing or obstructing one is a silent, expensive failure at
print/USPS. The Address Area as a free box is redundant — recipient addresses come from the mailing
list / merge fields.

## Requirements (all owner-confirmed)

1. **Remove the Address Area** box entirely from the designer (drop the `address` print zone / any
   placeable address box).
2. **Stamp Area** and **Indicia Area** are real design elements (separate, different default sizes),
   **freely movable** (drag anywhere).
3. **Module-menu entries**: add a Stamp Area module and an Indicia Area module so users can add one
   if the piece doesn't already have it.
4. **Guarded delete**: deleting either triggers a confirmation dialog requiring explicit approval
   ("You're about to remove the Stamp/Indicia Area…"). Reuse a shared confirm-dialog pattern (like
   the contact-card last-card guard).
5. **Singleton + mutually exclusive** (value-add 1): at most one Stamp and one Indicia; and a piece
   uses stamp **OR** indicia, not both — once one exists, the Module menu hides/disables the others
   (or warns). No duplicate.
6. **Locked by default** (value-add 4): new Stamp/Indicia elements start `locked` so they aren't
   nudged accidentally (existing lock toggle still lets the user move them deliberately).
7. **Clear on-canvas labels** (value-add 5): the boxes render labelled "STAMP" / "INDICIA".
8. **Keep-clear / no-overlay** (owner addition): Stamp and Indicia are **exclusive zones** — no other
   element may be placed or dragged on top of them. Reject/block any drop or move that would
   intersect a stamp/indicia box (and prevent dropping new modules onto them).

## Explicitly out of scope (owner declined)

- USPS clearance-rule preflight validation (value-add 2) — not now.
- Snap-to-USPS-position affordance (value-add 3) — not now.

## Constraints

- **UI-only — no DB schema changes / no migrations** (the other session's `/goal` shares the local
  Supabase DB). If something seems to need a schema change, STOP and ask.
- Stay in this worktree; dev server on a **free, non-3010 port**; never touch the main `yls/` tree.
- All source files **≤350 LOC**; TypeScript strict, no `any`; reuse existing patterns + the merged
  `components/designer/ui/` design system. No FPD.
- Invoke **frontend-design** before UI work. Verify in **chrome-devtools** (never Playwright), both
  themes. Leave the browser open.

## Likely-affected code (verify before editing)

- `components/designer/mail-spec.ts` — print zones incl. `address`/`indicia` SpecRects (drop address;
  decide whether stamp/indicia remain as guides or become element-only).
- `components/designer/canvas/print-overlay.tsx` — renders address/indicia overlay labels.
- `components/designer/module-definitions.ts` + `modules-panel.tsx` — add Stamp/Indicia modules
  (incl. singleton/mutex availability logic).
- `components/designer/canvas/canvas-area.tsx` — drag/drop + move; add keep-clear overlap rejection
  and the guarded-delete hook; render labels; lock-by-default on create.
- `components/designer/canvas/render-element.tsx` + `types/designer.ts` — new element type(s) for
  stamp/indicia (or a `postage` element with a `kind`).
- A shared confirm dialog component for guarded delete.
- Pure overlap/intersection math → its own module + co-located mocha tests (`tests/designer/`).

## Phases (each ends with a checkpoint commit; gates: typecheck:ui 0, per-file eslint 0, mocha pass)

- **P1 — Model + remove Address.** Add postage element type(s) (stamp/indicia, default sizes,
  `locked` default, label); drop the Address Area zone/box. Pure helpers (overlap test, singleton/
  mutex availability) with mocha tests.
- **P2 — Module menu.** Stamp Area + Indicia Area module entries with singleton + mutual-exclusion
  availability; add-to-canvas wiring.
- **P3 — Canvas behavior.** Keep-clear overlap rejection on drop + move; on-canvas STAMP/INDICIA
  labels; locked-by-default respected.
- **P4 — Guarded delete.** Shared confirm dialog; deletion of stamp/indicia requires approval.
- **P5 — Polish + verification.** Both-theme CDT pass; build exit 0; LOC ≤350; report.

## Verification

Per phase: chrome-devtools both themes (place, move, overlap-reject, delete-guard, module
availability). Pure math (overlap, singleton/mutex) → mocha. `npm run build` exit 0 at the end.

## Open questions for the build session to resolve early

- Do Stamp/Indicia remain represented in `mail-spec` as default placement hints, or become purely
  user-placed elements? (Default placement on add is fine; they're then movable.)
- One element type with `kind: 'stamp' | 'indicia'` vs two types — pick the smaller, clearer model.
