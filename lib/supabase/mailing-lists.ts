import { createClient } from '@/utils/supabase/client'
import type {
  MailingList,
  MailingListRecord,
  Tag,
  Campaign,
} from '@/types/supabase'

// Re-exporting ListCriteria for now, but this could be moved to a more specific file.
import type { ListCriteria } from '@/types/list-builder';

// Payload types for creating and updating records.
// These provide a clear API for the functions below.
export type CreateMailingListPayload = Pick<MailingList, 'name' | 'description' | 'criteria' | 'metadata'>;
export type UpdateMailingListPayload = Omit<Partial<MailingList>, 'id' | 'created_by' | 'created_at'>;
export type CreateMailingListRecordPayload = Omit<Partial<MailingListRecord>, 'id' | 'created_at' | 'created_by' | 'modified_at' | 'modified_by'> & { mailing_list_id: string };
export type UpdateMailingListRecordPayload = Omit<Partial<MailingListRecord>, 'id' | 'created_at' | 'created_by' | 'mailing_list_id'>;

// =================================================================================
// Mailing List Functions
// =================================================================================

export async function getMailingLists(): Promise<MailingList[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_lists')
    .select(`
      *,
      tags:mailing_list_tags(tag:tags(*)),
      campaigns:campaigns(*, orders:orders(*))
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getMailingList(id: string): Promise<MailingList> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_lists')
    .select(`
      *,
      tags:mailing_list_tags(tag:tags(*)),
      campaigns:campaigns(*, orders:orders(*)),
      records:mailing_list_records(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createMailingList(list: CreateMailingListPayload): Promise<MailingList> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('mailing_lists')
    .insert({
      ...list,
      created_by: user?.id,
      version: 1,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMailingList(id: string, updates: UpdateMailingListPayload): Promise<MailingList> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('mailing_lists')
    .update({
      ...updates,
      modified_at: new Date().toISOString(),
      modified_by: user?.id,
      // Increment version if it's passed in the updates.
      version: typeof updates.version === 'number' ? updates.version + 1 : undefined
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMailingList(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('mailing_lists').delete().eq('id', id)
  if (error) throw error
}

// =================================================================================
// Mailing List Record Functions
// =================================================================================

export async function getMailingListRecords(
  listId?: string,
  filters?: {
    search?: string
    status?: string
    tags?: string[]
    limit?: number
    offset?: number
  }
): Promise<{ data: MailingListRecord[]; count: number }> {
  const supabase = createClient()
  let query = supabase
    .from('mailing_list_records')
    .select('*, tags:record_tags(tag:tags(*))', { count: 'exact' })

  if (listId) {
    query = query.eq('mailing_list_id', listId)
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,address_line1.ilike.%${filters.search}%`)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 10) - 1)

  if (error) throw error
  return { data: data || [], count: count || 0 }
}

export async function createMailingListRecord(record: CreateMailingListRecordPayload): Promise<MailingListRecord> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('mailing_list_records')
    .insert({
      ...record,
      created_by: user?.id,
      status: record.status || 'active'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMailingListRecord(id: string, updates: UpdateMailingListRecordPayload): Promise<MailingListRecord> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('mailing_list_records')
    .update({
      ...updates,
      modified_at: new Date().toISOString(),
      modified_by: user?.id
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMailingListRecord(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('mailing_list_records').delete().eq('id', id)
  if (error) throw error
}

export async function bulkImportRecords(listId: string, records: Partial<MailingListRecord>[]): Promise<MailingListRecord[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const recordsWithMetadata = records.map(record => ({
    ...record,
    mailing_list_id: listId,
    created_by: user?.id,
    status: record.status || 'active'
  }))
  
  const { data, error } = await supabase
    .from('mailing_list_records')
    .insert(recordsWithMetadata)
    .select()

  if (error) throw error
  return data || []
}

// =================================================================================
// Tag Functions
// =================================================================================

export async function getTags(): Promise<Tag[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tags').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tags').insert({ name, color }).select().single()
  if (error) throw error
  return data
}

export async function addTagToList(listId: string, tagId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('mailing_list_tags').insert({ mailing_list_id: listId, tag_id: tagId })
  if (error) throw error
}

export async function removeTagFromList(listId: string, tagId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('mailing_list_tags').delete().match({ mailing_list_id: listId, tag_id: tagId })
  if (error) throw error
}

// =================================================================================
// Other Functions
// =================================================================================

// Note: The 'updateListRecordCount' function was removed because this is now handled
// by a database trigger for better reliability and performance.

// Note: The 'deduplicateRecords' function has been moved to 'mailing-lists-extended.ts'
// to keep this file focused on core CRUD operations.
