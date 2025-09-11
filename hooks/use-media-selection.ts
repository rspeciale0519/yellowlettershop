"use client"

import { useCallback, useMemo, useState } from "react"
import { useDragSelection } from "@/hooks/use-drag-selection"

export interface MediaLike {
  id: string
}

export function useMediaSelection(filteredMediaFiles: MediaLike[]) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null)

  const allSelected = useMemo(
    () => filteredMediaFiles.length > 0 && selectedFiles.size === filteredMediaFiles.length,
    [filteredMediaFiles.length, selectedFiles]
  )

  const handleFileSelect = useCallback((fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (selected) next.add(fileId)
      else next.delete(fileId)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const allIds = filteredMediaFiles.map(f => f.id)
    setSelectedFiles(new Set(allIds))
  }, [filteredMediaFiles])

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles(new Set())
  }, [])

  const toggleBulkSelect = useCallback(() => {
    setBulkSelectMode(prev => {
      const next = !prev
      if (!next) {
        setSelectedFiles(new Set())
        setLastClickedIndex(null)
      }
      return next
    })
  }, [])

  const handleItemClick = useCallback(
    (fileId: string, index: number, event: React.MouseEvent) => {
      if (bulkSelectMode) {
        if (event.shiftKey && lastClickedIndex !== null) {
          const start = Math.min(lastClickedIndex, index)
          const end = Math.max(lastClickedIndex, index)
          const rangeIds = filteredMediaFiles.slice(start, end + 1).map(f => f.id)
          setSelectedFiles(prev => {
            const next = new Set(prev)
            rangeIds.forEach(id => next.add(id))
            return next
          })
        } else if (event.ctrlKey || event.metaKey) {
          handleFileSelect(fileId, !selectedFiles.has(fileId))
        } else {
          handleFileSelect(fileId, !selectedFiles.has(fileId))
        }
        setLastClickedIndex(index)
      }
    },
    [bulkSelectMode, lastClickedIndex, filteredMediaFiles, selectedFiles, handleFileSelect]
  )

  const { containerRef, registerItem, handleMouseDown, isDragging, dragStyle } = useDragSelection({
    onSelectionChange: (ids) => {
      if (bulkSelectMode) setSelectedFiles(new Set(ids))
    },
    disabled: !bulkSelectMode,
  })

  return {
    // selection state
    selectedFiles,
    setSelectedFiles,
    bulkSelectMode,
    setBulkSelectMode,
    lastClickedIndex,
    setLastClickedIndex,
    allSelected,
    // handlers
    handleFileSelect,
    handleSelectAll,
    handleDeselectAll,
    handleItemClick,
    toggleBulkSelect,
    // drag selection
    containerRef,
    registerItem,
    handleMouseDown,
    isDragging,
    dragStyle,
  }
}

