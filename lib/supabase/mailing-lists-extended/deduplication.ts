// Mailing list deduplication utilities
import { createClient } from '@/utils/supabase/client'
import { createServerClient } from '@/utils/supabase/server'

/**
 * Deduplicate records in a mailing list by a specific column.
 * The column must be one of the whitelisted database column names.
 */
export async function deduplicateList(
  listId: string,
  field: 'address_line1' | 'full_name' | 'phone' | 'email' | 'external_id',
  options?: {
    matchingStrategy?: 'exact' | 'fuzzy'
    keepStrategy?: 'first' | 'last' | 'most_complete'
    createBackup?: boolean
  }
): Promise<{ duplicatesFound: number; removed: number }> {
  const supabase = typeof window === 'undefined' ? await createServerClient() : createClient()
  
  // Runtime whitelist (defense-in-depth)
  const allowedColumns = ['address_line1', 'full_name', 'phone', 'email', 'external_id'] as const
  if (!allowedColumns.includes(field)) {
    throw new Error(`Invalid field: ${field}`)
  }

  const {
    matchingStrategy = 'exact',
    keepStrategy = 'most_complete', 
    createBackup = true 
  } = options || {}
  
  // Create backup if requested
  if (createBackup) {
    const { createListVersion } = await import('./versioning')
    await createListVersion(listId, 'Backup before deduplication')
  }
  
  // Use whitelisted column name directly
  const dedupeField = field
  
  // Get all records for this list
  const { data: records, error } = await supabase
    .from('mailing_list_records')
    .select('*')
    .eq('mailing_list_id', listId)
    .not(dedupeField, 'is', null)
    .order('created_at', { ascending: keepStrategy === 'first' })
  
  if (error || !records) {
    throw error || new Error('No records found')
  }
  
  // Group records by the dedupe field
  const groups = new Map<string, any[]>()
  
  for (const record of records) {
    const val = String(record[dedupeField] ?? '')
    const key = matchingStrategy === 'fuzzy'
      ? val.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '')
      : val.trim()
    if (!key) continue

    // …rest of loop logic…
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(record)
  }
  
  // Find duplicates and decide which to keep
  const toDelete: string[] = []
  let duplicatesFound = 0
  
  for (const [key, groupRecords] of groups) {
    if (groupRecords.length > 1) {
      duplicatesFound += groupRecords.length - 1
      
      let keepRecord: any
      if (keepStrategy === 'most_complete') {
        // Keep the record with most non-null fields
        keepRecord = groupRecords.reduce((best, current) => {
          const bestCount = Object.values(best).filter(v => v !== null).length
          const currentCount = Object.values(current).filter(v => v !== null).length
          return currentCount > bestCount ? current : best
        })
      } else {
        // First or last based on sort order
        keepRecord = groupRecords[0]
      }
      
      // Mark others for deletion
      for (const record of groupRecords) {
        if (record.id !== keepRecord.id) {
          toDelete.push(record.id)
        }
      }
    }
  }
  
  // Delete duplicate records
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('mailing_list_records')
      .delete()
      .in('id', toDelete)
    
    if (deleteError) throw deleteError
    
    // Update record count
    const { count, error: countError } = await supabase
      .from('mailing_list_records')
      .select('*', { count: 'exact', head: true })
      .eq('mailing_list_id', listId)
    
    if (countError) {
      console.error('Failed to get updated record count:', countError)
      // Continue anyway, as the deduplication was successful
    } else {
      const { error: updateError } = await supabase
        .from('mailing_lists')
        .update({ record_count: count || 0 })
        .eq('id', listId)
      
      if (updateError) {
        console.error('Failed to update record count:', updateError)
      }
    }
  }
  
  return {
    duplicatesFound,
    removed: toDelete.length
  }
}
