import type { ListCriteria } from '@/lib/supabase/mailing-lists'
import { fetchRecords, estimateRecordCount, criteriaToAccuZIPParams } from './accuzip'
import { createMailingList } from '@/lib/supabase/mailing-lists'
import { bulkImportRecords } from '@/lib/supabase/mailing-lists-extended'

/**
 * Create a mailing list from AccuZIP criteria
 */
export async function createListFromAccuZIPCriteria(
  name: string,
  criteria: ListCriteria,
  options?: {
    sampleSize?: number
    deduplicationField?: string
    description?: string
    fetchLimit?: number
  }
): Promise<{ 
  listId: string
  recordCount: number
  estimatedTotal: number
  success: boolean
  error?: string 
}> {
  try {
    // First estimate the total count
    const estimatedTotal = await estimateRecordCount(criteria)
    
    // Create the list in the database
    const list = await createMailingList({
      name,
      description: options?.description || `List created from AccuZIP criteria (Est. ${estimatedTotal.toLocaleString()} records)`,
      criteria,
      metadata: {
        source: 'accuzip',
        createdFrom: 'list_builder',
        estimatedTotal,
        criteria,
        searchParams: criteriaToAccuZIPParams(criteria)
      }
    })
    
    // Determine how many records to fetch
    const fetchLimit = options?.fetchLimit || 5000 // Default max 5000 records
    const actualLimit = options?.sampleSize 
      ? Math.min(options.sampleSize, fetchLimit)
      : fetchLimit
    
    // Fetch records from AccuZIP
    const { records, totalCount } = await fetchRecords(criteria, actualLimit, 0)
    
    if (records && records.length > 0) {
      // Import records to the list with deduplication
      const importResult = await bulkImportRecords(
        list.id,
        records,
        options?.deduplicationField
      )
      
      return {
        listId: list.id,
        recordCount: importResult.success,
        estimatedTotal: totalCount || estimatedTotal,
        success: true
      }
    }
    
    return {
      listId: list.id,
      recordCount: 0,
      estimatedTotal,
      success: true
    }
    
  } catch (error) {
    console.error('Error creating list from AccuZIP:', error)
    return {
      listId: '',
      recordCount: 0,
      estimatedTotal: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create list'
    }
  }
}

/**
 * Fetch additional records for an existing list
 */
export async function fetchMoreRecordsForList(
  listId: string,
  criteria: ListCriteria,
  options?: {
    limit?: number
    offset?: number
    deduplicationField?: string
  }
): Promise<{
  imported: number
  duplicates: number
  failed: number
  hasMore: boolean
}> {
  try {
    const limit = options?.limit || 1000
    const offset = options?.offset || 0
    
    // Fetch more records from AccuZIP
    const { records, hasMore } = await fetchRecords(criteria, limit, offset)
    
    if (records && records.length > 0) {
      // Import the additional records
      const importResult = await bulkImportRecords(
        listId,
        records,
        options?.deduplicationField
      )
      
      return {
        imported: importResult.success,
        duplicates: importResult.duplicates,
        failed: importResult.failed,
        hasMore
      }
    }
    
    return {
      imported: 0,
      duplicates: 0,
      failed: 0,
      hasMore: false
    }
    
  } catch (error) {
    console.error('Error fetching more records:', error)
    return {
      imported: 0,
      duplicates: 0,
      failed: 0,
      hasMore: false
    }
  }
}

/**
 * Preview records that would be fetched for given criteria
 */
export async function previewRecordsFromCriteria(
  criteria: ListCriteria,
  limit: number = 10
): Promise<{
  records: any[]
  estimatedTotal: number
  success: boolean
  error?: string
}> {
  try {
    // Get count estimate
    const estimatedTotal = await estimateRecordCount(criteria)
    
    // Fetch a small sample of records
    const { records } = await fetchRecords(criteria, limit, 0)
    
    return {
      records,
      estimatedTotal,
      success: true
    }
    
  } catch (error) {
    console.error('Error previewing records:', error)
    return {
      records: [],
      estimatedTotal: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview records'
    }
  }
}

/**
 * Validate and update records in a list using AccuZIP
 */
export async function validateListRecords(
  listId: string,
  validationType: 'address' | 'phone' | 'email' = 'address',
  options?: {
    updateInvalid?: boolean
    createBackup?: boolean
  }
): Promise<{
  validated: number
  valid: number
  invalid: number
  updated: number
}> {
  const { createListVersion } = await import('@/lib/supabase/mailing-lists-extended')
  const { getMailingListRecords, updateMailingListRecord } = await import('@/lib/supabase/mailing-lists')
  const { batchValidateRecords } = await import('./accuzip')
  
  try {
    // Create backup if requested
    if (options?.createBackup) {
      await createListVersion(listId, 'Backup before validation')
    }
    
    // Get all records for the list
    const { data: records } = await getMailingListRecords(listId)
    
    if (!records || records.length === 0) {
      return { validated: 0, valid: 0, invalid: 0, updated: 0 }
    }
    
    // Batch validate records
    const validationResults = await batchValidateRecords(records, validationType)
    
    let valid = 0
    let invalid = 0
    let updated = 0
    
    // Process validation results
    for (const result of validationResults) {
      if (result.valid) {
        valid++
      } else {
        invalid++
        
        // Update record as invalid if requested
        if (options?.updateInvalid) {
          await updateMailingListRecord(result.recordId, {
            is_valid: false,
            validation_errors: result.errors
          })
          updated++
        }
      }
    }
    
    return {
      validated: validationResults.length,
      valid,
      invalid,
      updated
    }
    
  } catch (error) {
    console.error('Error validating list records:', error)
    return { validated: 0, valid: 0, invalid: 0, updated: 0 }
  }
}
