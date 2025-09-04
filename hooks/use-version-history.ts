'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ChangeHistory } from '@/types/supabase'
import { 
  getUndoRedoState, 
  undoLastChange, 
  redoLastChange,
  clearUndoHistory as clearHistory,
  type UndoRedoState 
} from '@/lib/version-history/undo-redo'
import { 
  recordChange, 
  createSnapshot, 
  getUserChangeHistory 
} from '@/lib/version-history/change-tracker'
import { createClient } from '@/utils/supabase/client'
import type { ResourceType, ChangeType } from '@/types/supabase'

export interface UseVersionHistoryOptions {
  resourceType?: ResourceType
  resourceId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseVersionHistoryReturn {
  // State
  undoRedoState: UndoRedoState
  changeHistory: ChangeHistory[]
  isLoading: boolean
  error: string | null
  
  // Actions
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  refresh: () => Promise<void>
  clearHistory: () => Promise<void>
  
  // Change tracking helpers
  trackChange: (
    resourceType: ResourceType,
    resourceId: string,
    changeType: ChangeType,
    options?: {
      fieldName?: string
      oldValue?: any
      newValue?: any
      description?: string
      batchId?: string
    }
  ) => Promise<ChangeHistory | null>
  
  createDataSnapshot: (
    resourceType: ResourceType,
    resourceId: string,
    snapshotData: any,
    description?: string
  ) => Promise<boolean>
}

/**
 * Hook for managing version history, undo/redo operations, and change tracking
 */
export function useVersionHistory(options: UseVersionHistoryOptions = {}): UseVersionHistoryReturn {
  const {
    resourceType,
    resourceId,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options

  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false
  })
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current state and history
  const refresh = useCallback(async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if user is authenticated first
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // User not authenticated - reset to default state
        setUndoRedoState({ canUndo: false, canRedo: false })
        setChangeHistory([])
        return
      }
      
      const [state, history] = await Promise.all([
        getUndoRedoState(),
        getUserChangeHistory(50, resourceType, resourceId)
      ])
      
      setUndoRedoState(state)
      setChangeHistory(history)
    } catch (err) {
      const errorMessage = (err as Error).message
      if (errorMessage.includes('not authenticated')) {
        // Reset to default state on auth error
        setUndoRedoState({ canUndo: false, canRedo: false })
        setChangeHistory([])
        setError(null) // Don't show auth errors as they're normal during loading
      } else {
        setError(errorMessage)
        console.error('Failed to refresh version history:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [resourceType, resourceId, isLoading])

  // Undo operation
  const undo = useCallback(async (): Promise<boolean> => {
    if (!undoRedoState.canUndo || isLoading) return false
    
    // Check authentication before attempting undo
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      const success = await undoLastChange()
      if (success) {
        await refresh()
      } else {
        setError('Failed to undo last change')
      }
      return success
    } catch (err) {
      const errorMessage = (err as Error).message
      if (!errorMessage.includes('not authenticated')) {
        setError(`Undo failed: ${errorMessage}`)
        console.error('Undo operation failed:', err)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }, [undoRedoState.canUndo, isLoading, refresh])

  // Redo operation
  const redo = useCallback(async (): Promise<boolean> => {
    if (!undoRedoState.canRedo || isLoading) return false
    
    // Check authentication before attempting redo
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    setIsLoading(true)
    setError(null)
    
    try {
      const success = await redoLastChange()
      if (success) {
        await refresh()
      } else {
        setError('Failed to redo last change')
      }
      return success
    } catch (err) {
      const errorMessage = (err as Error).message
      if (!errorMessage.includes('not authenticated')) {
        setError(`Redo failed: ${errorMessage}`)
        console.error('Redo operation failed:', err)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }, [undoRedoState.canRedo, isLoading, refresh])

  // Clear all history
  const clearUndoHistory = useCallback(async (): Promise<void> => {
    if (isLoading) return
    
    // Check authentication before attempting clear
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await clearHistory()
      await refresh()
    } catch (err) {
      const errorMessage = (err as Error).message
      if (!errorMessage.includes('not authenticated')) {
        setError(`Failed to clear history: ${errorMessage}`)
        console.error('Clear history failed:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, refresh])

  // Track a change
  const trackChange = useCallback(async (
    resourceType: ResourceType,
    resourceId: string,
    changeType: ChangeType,
    options?: {
      fieldName?: string
      oldValue?: any
      newValue?: any
      description?: string
      batchId?: string
    }
  ): Promise<ChangeHistory | null> => {
    try {
      // Check authentication before tracking change
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      
      const change = await recordChange(resourceType, resourceId, changeType, {
        fieldName: options?.fieldName,
        oldValue: options?.oldValue,
        newValue: options?.newValue,
        description: options?.description,
        batchId: options?.batchId,
        isUndoable: true
      })
      
      // Refresh state after tracking change
      await refresh()
      
      return change
    } catch (err) {
      const errorMessage = (err as Error).message
      if (!errorMessage.includes('not authenticated')) {
        console.error('Failed to track change:', err)
        setError(`Failed to track change: ${errorMessage}`)
      }
      return null
    }
  }, [refresh])

  // Create data snapshot
  const createDataSnapshot = useCallback(async (
    resourceType: ResourceType,
    resourceId: string,
    snapshotData: any,
    description?: string
  ): Promise<boolean> => {
    try {
      // Check authentication before creating snapshot
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      
      const snapshot = await createSnapshot(
        resourceType,
        resourceId,
        snapshotData,
        'manual',
        description
      )
      return !!snapshot
    } catch (err) {
      const errorMessage = (err as Error).message
      if (!errorMessage.includes('not authenticated')) {
        console.error('Failed to create snapshot:', err)
        setError(`Failed to create snapshot: ${errorMessage}`)
      }
      return false
    }
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    refresh()
    
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      
      // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y for redo
      if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
          (event.ctrlKey && event.key === 'y')) {
        event.preventDefault()
        redo()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    undoRedoState,
    changeHistory,
    isLoading,
    error,
    undo,
    redo,
    refresh,
    clearHistory: clearUndoHistory,
    trackChange,
    createDataSnapshot
  }
}

/**
 * Simplified hook for just undo/redo operations without history display
 */
export function useUndoRedo() {
  const { undoRedoState, undo, redo, isLoading, error } = useVersionHistory({
    autoRefresh: true,
    refreshInterval: 10000 // Faster refresh for active undo/redo
  })

  return {
    canUndo: undoRedoState.canUndo,
    canRedo: undoRedoState.canRedo,
    undo,
    redo,
    isLoading,
    error
  }
}

/**
 * Hook for tracking changes to a specific resource
 */
export function useChangeTracking(resourceType: ResourceType, resourceId?: string) {
  const { trackChange, createDataSnapshot, changeHistory, refresh } = useVersionHistory({
    resourceType,
    resourceId,
    autoRefresh: !!resourceId
  })

  const trackFieldChange = useCallback(async (
    fieldName: string,
    oldValue: any,
    newValue: any,
    description?: string
  ): Promise<ChangeHistory | null> => {
    if (!resourceId) {
      console.warn('Cannot track change: resourceId is required')
      return null
    }

    return trackChange(resourceType, resourceId, 'update', {
      fieldName,
      oldValue,
      newValue,
      description
    })
  }, [trackChange, resourceType, resourceId])

  const trackCreate = useCallback(async (
    newResourceId: string,
    newValue: any,
    description?: string
  ): Promise<ChangeHistory | null> => {
    return trackChange(resourceType, newResourceId, 'create', {
      newValue,
      description
    })
  }, [trackChange, resourceType])

  const trackDelete = useCallback(async (
    deletedResourceId: string,
    oldValue: any,
    description?: string
  ): Promise<ChangeHistory | null> => {
    return trackChange(resourceType, deletedResourceId, 'delete', {
      oldValue,
      description
    })
  }, [trackChange, resourceType])

  return {
    trackFieldChange,
    trackCreate,
    trackDelete,
    createDataSnapshot,
    changeHistory: resourceId ? changeHistory : [],
    refresh
  }
}