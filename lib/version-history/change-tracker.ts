import { createClient } from '@/utils/supabase/client'
import type { 
  ChangeHistory, 
  DataSnapshot, 
  ResourceType, 
  ChangeType 
} from '@/types/supabase'

// =================================================================================
// Change Tracking Utilities
// =================================================================================

export interface ChangeTrackingOptions {
  batchId?: string
  description?: string
  isUndoable?: boolean
}

export interface RecordChangeOptions extends ChangeTrackingOptions {
  fieldName?: string
  oldValue?: any
  newValue?: any
}

/**
 * Records a change in the change history table for undo/redo functionality
 */
export async function recordChange(
  resourceType: ResourceType,
  resourceId: string,
  changeType: ChangeType,
  options: RecordChangeOptions = {}
): Promise<ChangeHistory | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const changeRecord = {
    user_id: user.id,
    resource_type: resourceType,
    resource_id: resourceId,
    change_type: changeType,
    field_name: options.fieldName,
    old_value: options.oldValue ? JSON.stringify(options.oldValue) : null,
    new_value: options.newValue ? JSON.stringify(options.newValue) : null,
    batch_id: options.batchId,
    description: options.description,
    is_undoable: options.isUndoable ?? true
  }

  const { data, error } = await supabase
    .from('change_history')
    .insert(changeRecord)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Records multiple changes as a batch operation
 */
export async function recordBatchChanges(
  changes: Array<{
    resourceType: ResourceType
    resourceId: string
    changeType: ChangeType
    options?: RecordChangeOptions
  }>,
  batchDescription?: string
): Promise<ChangeHistory[]> {
  const batchId = crypto.randomUUID()
  
  const results: ChangeHistory[] = []
  
  for (const change of changes) {
    const result = await recordChange(
      change.resourceType,
      change.resourceId,
      change.changeType,
      {
        ...change.options,
        batchId,
        description: change.options?.description || batchDescription
      }
    )
    if (result) results.push(result)
  }
  
  return results
}

/**
 * Creates a snapshot of the current state for quick restore
 */
export async function createSnapshot(
  resourceType: ResourceType,
  resourceId: string,
  snapshotData: any,
  snapshotType: 'auto' | 'manual' | 'pre_destructive' = 'auto',
  description?: string
): Promise<DataSnapshot | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const snapshot = {
    resource_type: resourceType,
    resource_id: resourceId,
    snapshot_data: snapshotData,
    snapshot_type: snapshotType,
    description,
    created_by: user.id
  }

  const { data, error } = await supabase
    .from('data_snapshots')
    .insert(snapshot)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Gets the change history for a user, ordered by sequence for undo/redo
 */
export async function getUserChangeHistory(
  limit: number = 50,
  resourceType?: ResourceType,
  resourceId?: string
): Promise<ChangeHistory[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  let query = supabase
    .from('change_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_undoable', true)
    .is('undone_at', null)
    .order('sequence_number', { ascending: false })
    .limit(limit)

  if (resourceType) {
    query = query.eq('resource_type', resourceType)
  }
  
  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  }

  const { data, error } = await query
  if (error) throw error
  
  return data || []
}

/**
 * Gets the next change to redo (most recent undone change)
 */
export async function getNextRedoChange(): Promise<ChangeHistory | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('change_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_undoable', true)
    .not('undone_at', 'is', null)
    .order('undone_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

/**
 * Marks a change as undone
 */
export async function markChangeAsUndone(changeId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('change_history')
    .update({
      undone_at: new Date().toISOString(),
      undone_by: user.id
    })
    .eq('id', changeId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Marks a change as redone (clears undone_at)
 */
export async function markChangeAsRedone(changeId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('change_history')
    .update({
      undone_at: null,
      undone_by: null
    })
    .eq('id', changeId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Gets all changes in a batch for batch undo/redo
 */
export async function getBatchChanges(batchId: string): Promise<ChangeHistory[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('change_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('batch_id', batchId)
    .order('sequence_number', { ascending: true })

  if (error) throw error
  return data || []
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
