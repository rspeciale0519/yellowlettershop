import { createClient } from '@/utils/supabase/client'
import type {
  MailingList,
  MailingListRecord,
  InsertMailingList,
  UpdateMailingList
} from '@/types/supabase'
import { recordChange, recordBatchChanges, createSnapshot } from '@/lib/version-history/change-tracker'

// =================================================================================
// Enhanced Mailing List Operations with Change Tracking
// =================================================================================

/**
 * Creates a new mailing list with change tracking
 */
export async function createMailingListWithHistory(
  listData: InsertMailingList,
  description?: string
): Promise<MailingList> {
  const supabase = createClient()
  
  // Create the mailing list
  const { data, error } = await supabase
    .from('mailing_lists')
    .insert(listData)
    .select()
    .single()

  if (error) throw error

  // Record the change
  await recordChange(
    'mailing_list',
    data.id,
    'create',
    {
      description: description || `Created mailing list "${data.name}"`,
      newValue: data
    }
  )

  return data
}

/**
 * Updates a mailing list with granular change tracking
 */
export async function updateMailingListWithHistory(
  id: string,
  updates: UpdateMailingList,
  description?: string
): Promise<MailingList> {
  const supabase = createClient()
  
  // Get current state for change tracking
  const { data: currentList, error: fetchError } = await supabase
    .from('mailing_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Update the mailing list
  const { data, error } = await supabase
    .from('mailing_lists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Record granular changes for each updated field
  const changes = []
  for (const [field, newValue] of Object.entries(updates)) {
    if (currentList[field as keyof MailingList] !== newValue) {
      changes.push({
        resourceType: 'mailing_list' as const,
        resourceId: id,
        changeType: 'update' as const,
        options: {
          fieldName: field,
          oldValue: currentList[field as keyof MailingList],
          newValue,
          description: description || `Updated ${field} in "${currentList.name}"`
        }
      })
    }
  }

  if (changes.length > 0) {
    await recordBatchChanges(changes, description)
  }

  return data
}

/**
 * Deletes a mailing list with change tracking
 */
export async function deleteMailingListWithHistory(
  id: string,
  description?: string
): Promise<void> {
  const supabase = createClient()
  
  // Get current state for restoration
  const { data: currentList, error: fetchError } = await supabase
    .from('mailing_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Create a snapshot before deletion
  await createSnapshot(
    'mailing_list',
    id,
    currentList,
    'pre_destructive',
    'Pre-deletion snapshot'
  )

  // Delete the mailing list
  const { error } = await supabase
    .from('mailing_lists')
    .delete()
    .eq('id', id)

  if (error) throw error

  // Record the change
  await recordChange(
    'mailing_list',
    id,
    'delete',
    {
      description: description || `Deleted mailing list "${currentList.name}"`,
      oldValue: currentList
    }
  )
}

/**
 * Imports records to a mailing list with batch change tracking
 */
export async function importRecordsWithHistory(
  mailingListId: string,
  records: Omit<MailingListRecord, 'id' | 'created_at' | 'updated_at'>[],
  description?: string
): Promise<MailingListRecord[]> {
  const supabase = createClient()
  
  // Insert records
  const { data, error } = await supabase
    .from('mailing_list_records')
    .insert(records.map(record => ({
      ...record,
      mailing_list_id: mailingListId
    })))
    .select()

  if (error) throw error

  // Update mailing list record count
  const { error: updateError } = await supabase
    .from('mailing_lists')
    .update({ record_count: records.length })
    .eq('id', mailingListId)

  if (updateError) throw updateError

  // Record the batch import
  await recordChange(
    'mailing_list',
    mailingListId,
    'import',
    {
      description: description || `Imported ${records.length} records`,
      newValue: { recordCount: records.length, records: data }
    }
  )

  return data
}

/**
 * Deduplicates records in a mailing list with change tracking
 */
export async function deduplicateRecordsWithHistory(
  mailingListId: string,
  duplicateIds: string[],
  description?: string
): Promise<void> {
  const supabase = createClient()
  
  // Get records before deletion for restoration
  const { data: duplicateRecords, error: fetchError } = await supabase
    .from('mailing_list_records')
    .select('*')
    .in('id', duplicateIds)

  if (fetchError) throw fetchError

  // Create snapshot before deduplication
  await createSnapshot(
    'mailing_list',
    mailingListId,
    { duplicateRecords },
    'pre_destructive',
    'Pre-deduplication snapshot'
  )

  // Delete duplicate records
  const { error } = await supabase
    .from('mailing_list_records')
    .delete()
    .in('id', duplicateIds)

  if (error) throw error

  // Update record count
  const { data: remainingRecords, error: countError } = await supabase
    .from('mailing_list_records')
    .select('id')
    .eq('mailing_list_id', mailingListId)

  if (countError) throw countError

  await supabase
    .from('mailing_lists')
    .update({ record_count: remainingRecords.length })
    .eq('id', mailingListId)

  // Record the deduplication
  await recordChange(
    'mailing_list',
    mailingListId,
    'deduplicate',
    {
      description: description || `Removed ${duplicateIds.length} duplicate records`,
      oldValue: duplicateRecords
    }
  )
}

/**
 * Updates a single record with change tracking
 */
export async function updateRecordWithHistory(
  recordId: string,
  updates: Partial<MailingListRecord>,
  description?: string
): Promise<MailingListRecord> {
  const supabase = createClient()
  
  // Get current state
  const { data: currentRecord, error: fetchError } = await supabase
    .from('mailing_list_records')
    .select('*')
    .eq('id', recordId)
    .single()

  if (fetchError) throw fetchError

  // Update the record
  const { data, error } = await supabase
    .from('mailing_list_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single()

  if (error) throw error

  // Record granular changes
  const changes = []
  for (const [field, newValue] of Object.entries(updates)) {
    if (currentRecord[field as keyof MailingListRecord] !== newValue) {
      changes.push({
        resourceType: 'mailing_list' as const,
        resourceId: currentRecord.mailing_list_id,
        changeType: 'update' as const,
        options: {
          fieldName: `record.${recordId}.${field}`,
          oldValue: currentRecord[field as keyof MailingListRecord],
          newValue,
          description: description || `Updated record ${field}`
        }
      })
    }
  }

  if (changes.length > 0) {
    await recordBatchChanges(changes, description)
  }

  return data
}

/**
 * Merges two mailing lists with change tracking
 */
export async function mergeMailingListsWithHistory(
  sourceListId: string,
  targetListId: string,
  description?: string
): Promise<void> {
  const supabase = createClient()
  
  // Get source list data
  const { data: sourceList, error: sourceError } = await supabase
    .from('mailing_lists')
    .select('*, records:mailing_list_records(*)')
    .eq('id', sourceListId)
    .single()

  if (sourceError) throw sourceError

  // Create snapshot before merge
  await createSnapshot(
    'mailing_list',
    sourceListId,
    sourceList,
    'pre_destructive',
    'Pre-merge snapshot'
  )

  // Move records to target list
  const { error: moveError } = await supabase
    .from('mailing_list_records')
    .update({ mailing_list_id: targetListId })
    .eq('mailing_list_id', sourceListId)

  if (moveError) throw moveError

  // Update target list record count
  const { data: targetRecords, error: countError } = await supabase
    .from('mailing_list_records')
    .select('id')
    .eq('mailing_list_id', targetListId)

  if (countError) throw countError

  await supabase
    .from('mailing_lists')
    .update({ record_count: targetRecords.length })
    .eq('id', targetListId)

  // Delete source list
  await supabase
    .from('mailing_lists')
    .delete()
    .eq('id', sourceListId)

  // Record the merge
  await recordChange(
    'mailing_list',
    targetListId,
    'merge',
    {
      description: description || `Merged list "${sourceList.name}" into target list`,
      oldValue: sourceList
    }
  )
}
