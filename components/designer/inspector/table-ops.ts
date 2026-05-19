import type { TableDesignElement } from "@/types/designer"

// Pure, rectangular-preserving table mutations (unit-tested). Each returns the
// changed subset; callers do onUpdateElement(id, addRow(element)).
type TableShape = Pick<TableDesignElement, "rows" | "columns" | "cells" | "headerRow">
type TablePatch = Pick<TableDesignElement, "rows" | "columns" | "cells">

export function addRow(t: TableShape): TablePatch {
  return {
    rows: t.rows + 1,
    columns: t.columns,
    cells: [...t.cells.map((r) => [...r]), Array.from({ length: t.columns }, () => "")],
  }
}

export function removeRow(t: TableShape): TablePatch {
  if (t.rows <= 1) return { rows: t.rows, columns: t.columns, cells: t.cells.map((r) => [...r]) }
  return {
    rows: t.rows - 1,
    columns: t.columns,
    cells: t.cells.slice(0, t.rows - 1).map((r) => [...r]),
  }
}

export function addColumn(t: TableShape): TablePatch {
  return {
    rows: t.rows,
    columns: t.columns + 1,
    cells: t.cells.map((r) => [...r, ""]),
  }
}

export function removeColumn(t: TableShape): TablePatch {
  if (t.columns <= 1) return { rows: t.rows, columns: t.columns, cells: t.cells.map((r) => [...r]) }
  return {
    rows: t.rows,
    columns: t.columns - 1,
    cells: t.cells.map((r) => r.slice(0, t.columns - 1)),
  }
}

export function toggleHeader(t: TableShape): Pick<TableDesignElement, "headerRow"> {
  return { headerRow: !t.headerRow }
}
