// Mailing list CSV import/export utilities
import { createServerClient } from '@/utils/supabase/server'
import type { MailingListRecord } from '@/types/supabase'

// Bulk import with better deduplication
export async function bulkImportRecords(
  listId: string,
  records: Partial<MailingListRecord>[],
  deduplicationField?: string
): Promise<{ success: number; failed: number; duplicates: number }> {
  const supabase = await createServerClient()
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
