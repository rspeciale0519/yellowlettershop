/**
 * Type definitions for mailing list records
 * Separates Supabase database shape (snake_case) from UI shape (camelCase)
 */

export interface SupabaseMailingListRecord {
  id: string
  mailing_list_id: string
  first_name: string | null
  last_name: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  email: string | null
  status: 'active' | 'doNotContact' | 'returnedMail'
  external_id: string | null
  created_at: string
  modified_at: string | null
  modified_by: string | null
  tags: Array<{ id: string; name: string }>
  campaigns: Array<{ id: string; name: string; status: string }>
}

export interface MailingRecordUI {
  id: string
  listId: string
  firstName: string
  lastName: string
  address: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  status: 'active' | 'doNotContact' | 'returnedMail'
  externalId: string
  createdAt: string
  modifiedAt: string
  modifiedBy: string
  tags: Array<{ id: string; name: string }>
  campaigns: Array<{ id: string; name: string; status: string }>
}

export type RecordStatus = 'active' | 'doNotContact' | 'returnedMail'

export interface EditingRecord {
  id: string
  field: string
  value: string
}

export type TagOption = { id: string; name: string }
