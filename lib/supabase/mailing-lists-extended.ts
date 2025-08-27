import { createClient } from '@/utils/supabase/client'
import type { MailingListRecord } from '@/types/supabase'

// Re-export all extended mailing list functions from their respective modules
export { createListVersion, restoreListVersion } from './mailing-lists-extended/versioning'
export { deduplicateList } from './mailing-lists-extended/deduplication'
export { bulkImportRecords, parseCSVData, exportRecordsToCSV } from './mailing-lists-extended/csv'
