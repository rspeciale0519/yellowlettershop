import { createClient } from '@/utils/supabase/client'
import { MailingListRecord } from './mailing-lists'

// Create a version/snapshot of the current list state
export async function createListVersion(
  listId: string, 
  changeDescription?: string
): Promise<void> {
  const supabase = createClient()
  
  // Get current list data
  const { data: list, error: listError } = await supabase
    .from('mailing_lists')
    .select('*')
    .eq('id', listId)
    .single()
  
  if (listError || !list) throw listError || new Error('List not found')
  
  // Get the latest version number
  const { data: versions, error: versionError } = await supabase
    .from('mailing_list_versions')
    .select('version_number')
    .eq('mailing_list_id', listId)
    .order('version_number', { ascending: false })
    .limit(1)
  
  if (versionError) throw versionError
  
  const nextVersion = versions && versions.length > 0 
    ? versions[0].version_number + 1 
    : 1
  
  // Create version record
  const { error: insertError } = await supabase
    .from('mailing_list_versions')
    .insert({
      mailing_list_id: listId,
      version_number: nextVersion,
      name: list.name,
      description: list.description,
      record_count: list.record_count,
      criteria: list.criteria,
      metadata: list.metadata,
      change_description: changeDescription
    })
  
  if (insertError) throw insertError
}

// Restore a list to a previous version
export async function restoreListVersion(
  listId: string, 
  versionNumber: number
): Promise<void> {
  const supabase = createClient()
  
  // First create a backup of current state
  await createListVersion(listId, 'Backup before restore')
  
  // Get the version to restore
  const { data: version, error: versionError } = await supabase
    .from('mailing_list_versions')
    .select('*')
    .eq('mailing_list_id', listId)
    .eq('version_number', versionNumber)
    .single()
  
  if (versionError || !version) {
    throw versionError || new Error('Version not found')
  }
  
  // Update the list with version data
  const { error: updateError } = await supabase
    .from('mailing_lists')
    .update({
      name: version.name,
      description: version.description,
      criteria: version.criteria,
      metadata: version.metadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', listId)
  
  if (updateError) throw updateError
}

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

// Bulk import with better deduplication
export async function bulkImportRecords(
  listId: string,
  records: Partial<MailingListRecord>[],
  deduplicationField?: string
): Promise<{ success: number; failed: number; duplicates: number }> {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  let success = 0
  let failed = 0
  let duplicates = 0
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    // Check for duplicates if deduplication is enabled
    if (deduplicationField) {
      const fieldValues = batch.map(r => (r as any)[deduplicationField]).filter(Boolean)
      if (fieldValues.length > 0) {
        const { data: existingRecords } = await supabase
          .from('mailing_list_records')
          .select(`id, ${deduplicationField}`)
          .eq('mailing_list_id', listId)
          .in(deduplicationField, fieldValues)
        
        const existingValues = new Set(
          existingRecords?.map((r: any) => r[deduplicationField]) || []
        )
        
        const uniqueRecords: Partial<MailingListRecord>[] = []
        for (const record of batch) {
          if (existingValues.has((record as any)[deduplicationField])) {
            duplicates++
          } else {
            uniqueRecords.push(record)
          }
        }
        
        if (uniqueRecords.length > 0) {
          const recordsWithMetadata = uniqueRecords.map(record => ({
            ...record,
            mailing_list_id: listId,
            created_by: userData?.user?.id,
            is_valid: true,
            created_at: new Date().toISOString()
          }))
          
          const { error } = await supabase
            .from('mailing_list_records')
            .insert(recordsWithMetadata)
          
          if (error) {
            failed += uniqueRecords.length
          } else {
            success += uniqueRecords.length
          }
        }
      }
    } else {
      // No deduplication, insert all
      const recordsWithMetadata = batch.map(record => ({
        ...record,
        mailing_list_id: listId,
        created_by: userData?.user?.id,
        is_valid: true,
        created_at: new Date().toISOString()
      }))
      
      const { error } = await supabase
        .from('mailing_list_records')
        .insert(recordsWithMetadata)
      
      if (error) {
        failed += batch.length
      } else {
        success += batch.length
      }
    }
  }
  
  // Update record count
  const { count } = await supabase
    .from('mailing_list_records')
    .select('*', { count: 'exact', head: true })
    .eq('mailing_list_id', listId)
  
  await supabase
    .from('mailing_lists')
    .update({ record_count: count || 0 })
    .eq('id', listId)
  
  return { success, failed, duplicates }
}

// Parse CSV data and prepare records for import
export function parseCSVData(csvData: string): Partial<MailingListRecord>[] {
  const lines = csvData.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const records: Partial<MailingListRecord>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const record: Partial<MailingListRecord> = {}
    
    headers.forEach((header, index) => {
      const value = values[index]
      
      // Map CSV headers to database fields
      switch(header.toLowerCase()) {
        case 'first name':
        case 'firstname':
          record.first_name = value
          break
        case 'last name':
        case 'lastname':
          record.last_name = value
          break
        case 'address':
        case 'address1':
        case 'address line 1':
          record.address_line1 = value
          break
        case 'address2':
        case 'address line 2':
          record.address_line2 = value
          break
        case 'city':
          record.city = value
          break
        case 'state':
          record.state = value
          break
        case 'zip':
        case 'zipcode':
        case 'zip code':
          record.zip_code = value
          break
        case 'phone':
        case 'phone number':
          record.phone = value
          break
        case 'email':
        case 'email address':
          record.email = value
          break
        default:
          // Store other fields in metadata
          if (!record.metadata) {
            record.metadata = {}
          }
          (record.metadata as any)[header] = value
      }
    })
    
    // Generate full name if not present
    if (!record.full_name && (record.first_name || record.last_name)) {
      record.full_name = `${record.first_name || ''} ${record.last_name || ''}`.trim()
    }
    
    records.push(record)
  }
  
  return records
}

// Export records to CSV format
export function exportRecordsToCSV(records: Partial<MailingListRecord>[]): string {
  if (!records || records.length === 0) return ''
  
  // Define headers
  const headers = [
    'First Name',
    'Last Name', 
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Zip Code',
    'Phone',
    'Email'
  ]
  
  // Build CSV content
  const csvLines = [headers.join(',')]
  
  for (const record of records) {
    const values = [
      record.first_name || '',
      record.last_name || '',
      record.address_line1 || '',
      record.address_line2 || '',
      record.city || '',
      record.state || '',
      record.zip_code || '',
      record.phone || '',
      record.email || ''
    ]
    
    // Escape values that contain commas
    const escapedValues = values.map(v => {
      if (v.includes(',') || v.includes('"')) {
        return `"${v.replace(/"/g, '""')}"`
      }
      return v
    })
    
    csvLines.push(escapedValues.join(','))
  }
  
  return csvLines.join('\n')
}
