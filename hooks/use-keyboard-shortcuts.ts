"use client"

import { useEffect, useCallback } from 'react'

interface UseKeyboardShortcutsOptions {
  onSelectAll?: () => void
  onDeselectAll?: () => void
  onBulkDelete?: () => void
  onEscape?: () => void
  disabled?: boolean
}

export function useKeyboardShortcuts({
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onEscape,
  disabled = false
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return

    // Don't trigger shortcuts if user is typing in an input
    const activeElement = document.activeElement
    if (
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.contentEditable === 'true'
    ) {
      return
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey

    switch (event.key) {
      case 'a':
      case 'A':
        if (isCtrlOrCmd && onSelectAll) {
          event.preventDefault()
          onSelectAll()
        }
        break

      case 'Escape':
        if (onEscape) {
          event.preventDefault()
          onEscape()
        } else if (onDeselectAll) {
          event.preventDefault()
          onDeselectAll()
        }
        break

      case 'Delete':
      case 'Backspace':
        // Only trigger delete on Delete key, not Backspace (to avoid accidents)
        if (event.key === 'Delete' && onBulkDelete) {
          event.preventDefault()
          onBulkDelete()
        }
        break

      case 'd':
      case 'D':
        if (isCtrlOrCmd && onDeselectAll) {
          event.preventDefault()
          onDeselectAll()
        }
        break
    }
  }, [disabled, onSelectAll, onDeselectAll, onBulkDelete, onEscape])

  useEffect(() => {
    if (disabled) return

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, disabled])

  return {
    // Return a ref that can be attached to the container to ensure focus
    containerProps: {
      tabIndex: -1,
      onFocus: (e: React.FocusEvent) => {
        // Ensure the container can receive focus for keyboard events
        if (e.target === e.currentTarget) {
          e.currentTarget.focus()
        }
      }
    }
  }
}