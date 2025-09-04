import { createClient } from '@/utils/supabase/client'
import type { 
  ChangeHistory, 
  MailingList, 
  MailingListRecord,
  ResourceType 
} from '@/types/supabase'
import { 
  getUserChangeHistory, 
  getNextRedoChange, 
  markChangeAsUndone, 
  markChangeAsRedone,
  getBatchChanges 
} from './change-tracker'

// =================================================================================
// Undo/Redo Operations
// =================================================================================

export interface UndoRedoState {
  canUndo: boolean
  canRedo: boolean
  lastChange?: ChangeHistory
  nextRedoChange?: ChangeHistory
}

/**
 * Gets the current undo/redo state for the user
 */
export async function getUndoRedoState(): Promise<UndoRedoState> {
  const [lastChange, nextRedoChange] = await Promise.all([
    getUserChangeHistory(1).then(changes => changes[0] || null),
    getNextRedoChange()
  ])

  return {
    canUndo: !!lastChange,
    canRedo: !!nextRedoChange,
    lastChange: lastChange || undefined,
    nextRedoChange: nextRedoChange || undefined
  }
}

/**
 * Undoes the last change made by the user
 */
export async function undoLastChange(): Promise<boolean> {
  const changes = await getUserChangeHistory(1)
  if (changes.length === 0) return false

  const lastChange = changes[0]
  
  // If it's a batch change, undo the entire batch
  if (lastChange.batch_id) {
    return await undoBatchChanges(lastChange.batch_id)
  }
  
  return await undoSingleChange(lastChange)
}

/**
 * Redoes the last undone change
 */
export async function redoLastChange(): Promise<boolean> {
  const nextChange = await getNextRedoChange()
  if (!nextChange) return false

  // If it's a batch change, redo the entire batch
  if (nextChange.batch_id) {
    return await redoBatchChanges(nextChange.batch_id)
  }
  
  return await redoSingleChange(nextChange)
}

/**
 * Undoes a single change
 */
async function undoSingleChange(change: ChangeHistory): Promise<boolean> {
  const supabase = createClient()
  
  try {
    switch (change.resource_type) {
      case 'mailing_list':
        return await undoMailingListChange(change)
      case 'template':
      case 'design':
      case 'contact_card':
      case 'asset':
        // TODO: Implement other resource types
        console.warn(`Undo not implemented for resource type: ${change.resource_type}`)
        return false
      default:
        return false
    }
  } catch (error) {
    console.error('Error undoing change:', error)
    return false
  }
}

/**
 * Redoes a single change
 */
async function redoSingleChange(change: ChangeHistory): Promise<boolean> {
  try {
    switch (change.resource_type) {
      case 'mailing_list':
        return await redoMailingListChange(change)
      case 'template':
      case 'design':
      case 'contact_card':
      case 'asset':
        // TODO: Implement other resource types
        console.warn(`Redo not implemented for resource type: ${change.resource_type}`)
        return false
      default:
        return false
    }
  } catch (error) {
    console.error('Error redoing change:', error)
    return false
  }
}

/**
 * Undoes all changes in a batch
 */
async function undoBatchChanges(batchId: string): Promise<boolean> {
  const batchChanges = await getBatchChanges(batchId)
  
  // Undo changes in reverse order (most recent first)
  for (let i = batchChanges.length - 1; i >= 0; i--) {
    const success = await undoSingleChange(batchChanges[i])
    if (!success) {
      console.error(`Failed to undo change ${batchChanges[i].id} in batch ${batchId}`)
      return false
    }
  }
  
  // Mark all changes in the batch as undone
  for (const change of batchChanges) {
    await markChangeAsUndone(change.id)
  }
  
  return true
}

/**
 * Redoes all changes in a batch
 */
async function redoBatchChanges(batchId: string): Promise<boolean> {
  const batchChanges = await getBatchChanges(batchId)
  
  // Redo changes in original order
  for (const change of batchChanges) {
    const success = await redoSingleChange(change)
    if (!success) {
      console.error(`Failed to redo change ${change.id} in batch ${batchId}`)
      return false
    }
  }
  
  // Mark all changes in the batch as redone
  for (const change of batchChanges) {
    await markChangeAsRedone(change.id)
  }
  
  return true
}

/**
 * Undoes a mailing list change
 */
async function undoMailingListChange(change: ChangeHistory): Promise<boolean> {
  const supabase = createClient()
  
  switch (change.change_type) {
    case 'create':
      // Delete the created mailing list
      const { error: deleteError } = await supabase
        .from('mailing_lists')
        .delete()
        .eq('id', change.resource_id)
      
      if (deleteError) throw deleteError
      await markChangeAsUndone(change.id)
      return true
      
    case 'update':
      // Restore the old value
      if (!change.old_value || !change.field_name) return false
      
      const oldValue = JSON.parse(change.old_value as unknown as string)
      const { error: updateError } = await supabase
        .from('mailing_lists')
        .update({ [change.field_name]: oldValue })
        .eq('id', change.resource_id)
      
      if (updateError) throw updateError
      await markChangeAsUndone(change.id)
      return true
      
    case 'delete':
      // Restore the deleted mailing list
      if (!change.old_value) return false
      
      const restoredList = JSON.parse(change.old_value as unknown as string)
      const { error: restoreError } = await supabase
        .from('mailing_lists')
        .insert(restoredList)
      
      if (restoreError) throw restoreError
      await markChangeAsUndone(change.id)
      return true
      
    default:
      return false
  }
}

/**
 * Redoes a mailing list change
 */
async function redoMailingListChange(change: ChangeHistory): Promise<boolean> {
  const supabase = createClient()
  
  switch (change.change_type) {
    case 'create':
      // Re-create the mailing list
      if (!change.new_value) return false
      
      const newList = JSON.parse(change.new_value as unknown as string)
      const { error: createError } = await supabase
        .from('mailing_lists')
        .insert(newList)
      
      if (createError) throw createError
      await markChangeAsRedone(change.id)
      return true
      
    case 'update':
      // Re-apply the new value
      if (!change.new_value || !change.field_name) return false
      
      const newValue = JSON.parse(change.new_value as unknown as string)
      const { error: updateError } = await supabase
        .from('mailing_lists')
        .update({ [change.field_name]: newValue })
        .eq('id', change.resource_id)
      
      if (updateError) throw updateError
      await markChangeAsRedone(change.id)
      return true
      
    case 'delete':
      // Re-delete the mailing list
      const { error: deleteError } = await supabase
        .from('mailing_lists')
        .delete()
        .eq('id', change.resource_id)
      
      if (deleteError) throw deleteError
      await markChangeAsRedone(change.id)
      return true
      
    default:
      return false
  }
}

/**
 * Clears all undo history for the current user
 */
export async function clearUndoHistory(): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('change_history')
    .delete()
    .eq('user_id', user.id)

  if (error) throw error
}
