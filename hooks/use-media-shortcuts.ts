"use client"

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface ShortcutsProps {
  bulkSelectMode: boolean
  handleSelectAll: () => void
  handleDeselectAll: () => void
  handleBulkDelete?: () => void
  exitBulkMode: () => void
}

export function useMediaShortcuts({ bulkSelectMode, handleSelectAll, handleDeselectAll, handleBulkDelete, exitBulkMode }: ShortcutsProps) {
  useKeyboardShortcuts({
    onSelectAll: bulkSelectMode ? handleSelectAll : () => {
      // When not in bulk mode, enable it and select all
      handleSelectAll()
    },
    onDeselectAll: handleDeselectAll,
    onBulkDelete: handleBulkDelete,
    onEscape: bulkSelectMode ? exitBulkMode : undefined,
    disabled: false,
  })
}

