# Shared Filter Primitives

Purpose: Provide small, composable UI primitives used across all list-builder filters so each domain file can be split into sections/fields without duplicating logic.

## Components (planned)
- NumericRange (min/max, inclusive/exclusive, empty handling)
- MultiSelect (searchable, virtualized options, clear-all)
- TagSelector (chips, any/all modes)
- ThreeOptionToggle (Yes/No/Any) — unify with existing `components/list-builder/mortgage-filters/components/three-option-toggle.tsx`
- CheckboxGroup (indeterminate, select-all)
- DateRange (absolute and relative presets)
- FieldLabel / HelpText / ErrorText (a11y-friendly)

## API guidelines
- Controlled inputs with `value` and `onChange` where `onChange` emits a minimal patch `{key?: value}`.
- No data fetching; UI-only with clear props for labels/options.
- A11y: label-for, aria-describedby, keyboard nav, focus ring.
- Performance: memoized render, minimal prop spreads, avoid inline functions on hot paths.
- Testing: RTL-friendly structure; stable `data-testid` only where necessary.

## Structure
- Keep each primitive ≤ 150–200 LOC; extract subparts (labels, help, error) when growing.
- Co-locate minimal CSS (prefer Tailwind) or reuse existing utility classes.
- Unit test behavior in the consumer packages (Phase 1A) and add targeted unit tests here for tricky logic.
