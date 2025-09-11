"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

interface DragSelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

interface UseDragSelectionOptions {
  onSelectionChange: (selectedIds: string[]) => void
  disabled?: boolean
}

interface DragSelectionItem {
  id: string
  element: HTMLElement
  bounds: DOMRect
}

export function useDragSelection({
  onSelectionChange,
  disabled = false
}: UseDragSelectionOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragRect, setDragRect] = useState<DragSelectionRect | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<Map<string, DragSelectionItem>>(new Map())
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const registerItem = useCallback((id: string, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect()
    itemsRef.current.set(id, { id, element, bounds })
    
    return () => {
      itemsRef.current.delete(id)
    }
  }, [])

  const getItemsInRect = useCallback((rect: DragSelectionRect) => {
    const containerBounds = containerRef.current?.getBoundingClientRect()
    if (!containerBounds) return []

    const selectionRect = {
      left: Math.min(rect.startX, rect.endX),
      top: Math.min(rect.startY, rect.endY),
      right: Math.max(rect.startX, rect.endX),
      bottom: Math.max(rect.startY, rect.endY)
    }

    const selectedItems: string[] = []

    itemsRef.current.forEach((item) => {
      const itemRect = {
        left: item.bounds.left - containerBounds.left,
        top: item.bounds.top - containerBounds.top,
        right: item.bounds.right - containerBounds.left,
        bottom: item.bounds.bottom - containerBounds.top
      }

      // Check if rectangles overlap
      const overlaps = !(
        selectionRect.right < itemRect.left ||
        selectionRect.left > itemRect.right ||
        selectionRect.bottom < itemRect.top ||
        selectionRect.top > itemRect.bottom
      )

      if (overlaps) {
        selectedItems.push(item.id)
      }
    })

    return selectedItems
  }, [])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || event.button !== 0) return

    const target = event.target as HTMLElement
    
    // Don't start drag if clicking on interactive elements
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    ) {
      return
    }

    const container = containerRef.current
    if (!container) return

    const containerBounds = container.getBoundingClientRect()
    const startX = event.clientX - containerBounds.left
    const startY = event.clientY - containerBounds.top

    dragStartRef.current = { x: startX, y: startY }
    
    event.preventDefault()
  }, [disabled])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragStartRef.current || disabled) return

    const container = containerRef.current
    if (!container) return

    if (!isDragging) {
      // Start dragging if mouse moved enough
      const deltaX = Math.abs(event.clientX - (dragStartRef.current.x + container.getBoundingClientRect().left))
      const deltaY = Math.abs(event.clientY - (dragStartRef.current.y + container.getBoundingClientRect().top))
      
      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true)
      }
      return
    }

    const containerBounds = container.getBoundingClientRect()
    const currentX = event.clientX - containerBounds.left
    const currentY = event.clientY - containerBounds.top

    const newRect = {
      startX: dragStartRef.current.x,
      startY: dragStartRef.current.y,
      endX: currentX,
      endY: currentY
    }

    setDragRect(newRect)

    // Update selection based on current drag rect
    const itemsInSelection = getItemsInRect(newRect)
    const newSelectedIds = new Set(itemsInSelection)
    setSelectedIds(newSelectedIds)
    onSelectionChange(itemsInSelection)
  }, [isDragging, disabled, getItemsInRect, onSelectionChange])

  const handleMouseUp = useCallback(() => {
    if (dragStartRef.current) {
      dragStartRef.current = null
      setIsDragging(false)
      setDragRect(null)
    }
  }, [])

  // Set up global mouse event listeners
  useEffect(() => {
    if (!isDragging) return

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const dragStyle = dragRect ? {
    position: 'absolute' as const,
    left: Math.min(dragRect.startX, dragRect.endX),
    top: Math.min(dragRect.startY, dragRect.endY),
    width: Math.abs(dragRect.endX - dragRect.startX),
    height: Math.abs(dragRect.endY - dragRect.startY),
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgb(59, 130, 246)',
    pointerEvents: 'none' as const,
    zIndex: 1000,
  } : undefined

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    onSelectionChange([])
  }, [onSelectionChange])

  return {
    containerRef,
    registerItem,
    handleMouseDown,
    isDragging,
    dragStyle,
    selectedIds,
    clearSelection
  }
}