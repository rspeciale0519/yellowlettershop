"use client"

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Undo2, Redo2, History } from 'lucide-react'
import { useUndoRedo } from '@/hooks/use-version-history'
import type { UndoRedoState } from '@/lib/version-history/undo-redo'

interface UndoRedoToolbarProps {
  onStateChange?: (state: UndoRedoState) => void
  onHistoryClick?: () => void
  className?: string
}

export function UndoRedoToolbar({ onStateChange, onHistoryClick, className }: UndoRedoToolbarProps) {
  const { canUndo, canRedo, undo, redo, isLoading, error } = useUndoRedo()

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({ canUndo, canRedo })
  }, [canUndo, canRedo, onStateChange])

  const handleUndo = async () => {
    if (canUndo && !isLoading) {
      await undo()
    }
  }

  const handleRedo = async () => {
    if (canRedo && !isLoading) {
      await redo()
    }
  }

  const getUndoTooltip = () => {
    if (!canUndo) return 'Nothing to undo'
    return 'Undo last change (Ctrl+Z)'
  }

  const getRedoTooltip = () => {
    if (!canRedo) return 'Nothing to redo'
    return 'Redo last undone change (Ctrl+Shift+Z)'
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo || isLoading}
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getUndoTooltip()}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo || isLoading}
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getRedoTooltip()}</p>
          </TooltipContent>
        </Tooltip>

        {onHistoryClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onHistoryClick}
                className="h-8 w-8 p-0"
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View change history</p>
            </TooltipContent>
          </Tooltip>
        )}

        {error && (
          <div className="text-xs text-red-600 ml-2 max-w-[200px] truncate" title={error}>
            {error}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
