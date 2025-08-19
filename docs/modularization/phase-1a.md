# Phase 1A: List Builder Modularization (Demographics)

Status: In Progress

## Goals
- Extract shared, reusable primitives and data from List Builder domain files without changing runtime behavior.
- Start small with Demographics: move option constants to a centralized data module for reuse and consistency.
- Keep public API and UI behavior stable; tests continue to pass.

## Scope (PR 1)
- Create `data/demographics.ts` with shared label/value constants.
- Refactor `components/list-builder/demographics-filters.tsx` to import from `@/data/demographics`.
- No changes to component logic, state shape, events, or rendering.

## Scope (PR 2)
- Extract `MultiSelect` and `DraggableSlider` primitives out of `components/list-builder/demographics-filters.tsx`.
- New modules:
  - `components/list-builder/common/multi-select.tsx`
  - `components/list-builder/common/draggable-slider.tsx`
- Update `components/list-builder/demographics-filters.tsx` to import and use these primitives.
- No changes to public props used by `DemographicsFilters`; UI/behavior preserved.

## Acceptance Criteria
- Build succeeds; no new TypeScript or ESLint errors introduced by this change.
- All tests pass (Mocha harness).
- Demographics filters UI behaves identically (manual smoke check).
- Constants are no longer duplicated in `demographics-filters.tsx`.

## Notes
- `@/` path mapping is configured via `tsconfig.json` (paths: { "@/*": ["./*"] }).
- This change prepares follow-up PRs to extract shared UI primitives (e.g., `MultiSelect`, `DraggableSlider`) into `components/list-builder/common/` without altering behavior.

## Change Log
- PR 1 (Demographics constants extraction)
  - Added: `data/demographics.ts` (GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, EDUCATION_LEVELS, OCCUPATION_CATEGORIES, EMPLOYMENT_STATUS, HOME_OWNERSHIP, CREDIT_RATINGS, INTERESTS, PURCHASING_BEHAVIOR, ETHNICITY_OPTIONS, LANGUAGE_OPTIONS, POLITICAL_AFFILIATIONS, VETERAN_STATUS, CHILDREN_AGE_RANGES)
  - Updated: `components/list-builder/demographics-filters.tsx` to import the above instead of defining inline arrays.

- PR 2 (Extract shared UI primitives)
  - Added: `components/list-builder/common/multi-select.tsx` and `components/list-builder/common/draggable-slider.tsx` implementing reusable primitives.
  - Updated: `components/list-builder/demographics-filters.tsx` to import `MultiSelect` and `DraggableSlider` from `@/components/list-builder/common/*` and removed inline implementations.
  - Updated: `components/list-builder/common/README.md` documenting the APIs for these primitives.

## Next PR Candidates
- Extract `MultiSelect` and `DraggableSlider` into `components/list-builder/common/` per `common/README.md` API guidelines.
- Add lightweight unit tests for these primitives and update consumer imports in demographics and other domains.
