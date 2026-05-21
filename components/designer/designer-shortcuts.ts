// Single source of truth for the designer keyboard shortcuts, mirroring the
// real bindings in hooks/use-designer-shortcuts.ts. Consumed by the Help
// dialog (Phase 14) so the reference can never drift from the implementation.
export interface ShortcutDescriptor {
  keys: string[]
  label: string
}

export const DESIGNER_SHORTCUTS: ShortcutDescriptor[] = [
  { keys: ["Esc"], label: "Deselect / cancel edit" },
  { keys: ["Delete"], label: "Delete selected element" },
  { keys: ["Ctrl", "D"], label: "Duplicate selected element" },
  { keys: ["Ctrl", "Z"], label: "Undo" },
  { keys: ["Ctrl", "Y"], label: "Redo" },
  { keys: ["Arrows"], label: "Nudge selected element 1px" },
  { keys: ["Shift", "Arrows"], label: "Nudge selected element 10px" },
  { keys: ["Ctrl", "Scroll"], label: "Zoom the canvas" },
]
