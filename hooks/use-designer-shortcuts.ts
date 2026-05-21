"use client"

import { useEffect } from "react"
import { nudgeDelta } from "@/hooks/nudge"

interface DesignerShortcutOptions {
  selectedElement: string | null
  onClearSelection: () => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onUndo: () => void
  onRedo: () => void
  onNudge?: (id: string, dx: number, dy: number) => void
}

export function useDesignerShortcuts({
  selectedElement,
  onClearSelection,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onNudge,
}: DesignerShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable='true']")) return
      if (event.key === "Escape") onClearSelection()
      if ((event.key === "Delete" || event.key === "Backspace") && selectedElement) onDelete(selectedElement)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && selectedElement) {
        event.preventDefault()
        onDuplicate(selectedElement)
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault()
        onUndo()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault()
        onRedo()
      }
      if (onNudge && selectedElement && !event.ctrlKey && !event.metaKey) {
        const delta = nudgeDelta(event.key, event.shiftKey)
        if (delta) {
          event.preventDefault()
          onNudge(selectedElement, delta.dx, delta.dy)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClearSelection, onDelete, onDuplicate, onNudge, onRedo, onUndo, selectedElement])
}
