# Phase 1B: Demographics Filters Split (Maintainability)

Status: In Progress

## Goals
- Reduce file size and complexity by splitting `components/list-builder/demographics-filters.tsx` into focused subcomponents (<350 LOC each).
- Preserve runtime behavior and public props while improving testability and reuse.
- Maintain a thin container that orchestrates state and delegates to presentational children.

## Scope
- Create directory: `components/list-builder/demographics/`
  - `DemographicsFilters.tsx` (container/orchestration only; wires props & handlers)
  - `DemographicsGroup.tsx` (collapsible group/section UI)
  - `MultiSelectField.tsx` (thin wrapper around `common/MultiSelect` with field label & helper)
  - `RangeSliderField.tsx` (thin wrapper around `common/DraggableSlider` with summary & bounds)
  - `SelectedChips.tsx` (renders removable chips)
  - `SectionHeader.tsx` (title + actions area such as Clear All)
- Update imports in `components/list-builder/demographics-filters.tsx` to compose these children.
- No behavior changes; all props/state flows remain stable.

## Acceptance Criteria
- Build succeeds; no new TS/ESLint errors introduced.
- All tests pass (`npm test`).
- Demographics UI smoke: selection, chip removal, slider bounds behave identically.
- File sizes: each new subcomponent <350 LOC; parent remains thin and readable.

## Tests
- Add targeted unit tests:
  - `MultiSelectField`: checkbox toggle, chip remove, keyboard interaction.
  - `RangeSliderField`: drag min/max, clamping, keyboard arrows.
- Keep existing integration tests green.

## Notes
- Shared primitives live in `components/list-builder/common/` (`MultiSelect`, `DraggableSlider`).
- Path alias `@/` via `tsconfig.json` remains.

## Change Log
- PR TBD — Created `components/list-builder/demographics/SectionHeader.tsx`, `DemographicsGroup.tsx`, and `SelectedChips.tsx`. Refactored `components/list-builder/demographics-filters.tsx` to compose these subcomponents for Basic, Economic, Lifestyle, Cultural, and Family sections, and for the Active Criteria chips. Behavior preserved.
- PR TBD — Added focused unit tests for new subcomponents: `tests/demographics-group.test.tsx` and `tests/selected-chips.test.tsx`.
