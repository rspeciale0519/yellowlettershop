# Table Primitives

Purpose: Provide reusable building blocks for data tables used by Mailing List Manager lists and records.

## Building blocks (planned)
- DataTable (shell around @tanstack/react-table)
- ColumnDefs (co-located per table)
- ColumnVisibility (toggle menu)
- ColumnFilters (text, select, date)
- Sorting (single/multi)
- RowSelection (checkboxes)
- Pagination (client or server)
- DensityToggle (compact/comfortable)
- Toolbar (export, refresh, clear filters)

## Guidelines
- Keep DataTable generic; pages provide column defs and data source.
- No app-specific logic; compose features via props and render callbacks.
- Support controlled state to enable server-driven pagination/sorting later.
- Keep files ≤ 200 LOC; extract subparts (Toolbar, FilterRow) as needed.

## Testing
- Unit test column helpers; smoke-test rendering with basic data.
- Per-table tests live next to the table that consumes these primitives.
