/**
 * Mapper utilities for mailing list records
 * Converts between Supabase database shape (snake_case) and UI shape (camelCase)
 */

import type { SupabaseMailingListRecord, MailingRecordUI } from '@/types/mailing-records'

/**
 * Maps a single Supabase record to UI format
 */
export function mapSupabaseRecordToUI(record: SupabaseMailingListRecord): MailingRecordUI {
  return {
    id: record.id,
    listId: record.mailing_list_id,
    firstName: record.first_name || '',
    lastName: record.last_name || '',
    address: record.address_line1 || '',
    addressLine2: record.address_line2 || '',
    city: record.city || '',
    state: record.state || '',
    zipCode: record.zip_code || '',
    phone: record.phone || '',
    email: record.email || '',
    status: record.status,
    externalId: record.external_id || '',
    createdAt: record.created_at,
    modifiedAt: record.modified_at || '',
    modifiedBy: record.modified_by || '',
    tags: record.tags || [],
    campaigns: record.campaigns || [],
  }
}

/**
 * Maps an array of Supabase records to UI format
 */
export function mapSupabaseRecords(records: SupabaseMailingListRecord[]): MailingRecordUI[] {
  return records.map(mapSupabaseRecordToUI)
}

/**
 * Mapping from UI field names to database field names
 * Used for translating edit operations back to database format
 */
export const uiToDbField: Record<string, string> = {
  listId: 'mailing_list_id',
  firstName: 'first_name',
  lastName: 'last_name',
  address: 'address_line1',
  addressLine2: 'address_line2',
  zipCode: 'zip_code',
  externalId: 'external_id',
  createdAt: 'created_at',
  modifiedAt: 'modified_at',
  modifiedBy: 'modified_by',
}

/**
 * Converts a UI field name to its corresponding database field name
 */
export function getDbFieldName(uiFieldName: string): string {
  return uiToDbField[uiFieldName] || uiFieldName
}
