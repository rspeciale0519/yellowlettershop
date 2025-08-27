// Mailing list deduplication utilities
import { createClient } from '@/utils/supabase/client'

// Enhanced deduplication with more options
export async function deduplicateList(
  listId: string,
  field: 'address' | 'name' | 'phone' | 'email',
  options?: {
    matchingStrategy?: 'exact' | 'fuzzy'
    keepStrategy?: 'first' | 'last' | 'most_complete'
    createBackup?: boolean
  }
): Promise<{ duplicatesFound: number; removed: number }> {
  const supabase = createClient()
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
  
  // Get the field to deduplicate by
  let dedupeField: string
  switch (field) {
    case 'address':
      dedupeField = 'address_line1'
      break
    case 'name':
      dedupeField = 'full_name'
      break
    case 'phone':
      dedupeField = 'phone'
      break
    case 'email':
      dedupeField = 'email'
      break
  }
  
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
    const key = matchingStrategy === 'fuzzy' 
      ? record[dedupeField].toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '')
      : record[dedupeField]
    
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
    const { count } = await supabase
      .from('mailing_list_records')
      .select('*', { count: 'exact', head: true })
      .eq('mailing_list_id', listId)
    
    await supabase
      .from('mailing_lists')
      .update({ record_count: count || 0 })
      .eq('id', listId)
  }
  
  return {
    duplicatesFound,
    removed: toDelete.length
  }
}
