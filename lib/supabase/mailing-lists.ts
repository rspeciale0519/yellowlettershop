import { createClient } from '@/utils/supabase/client'
import type {
  MailingList,
  MailingListRecord,
  Tag,
  Campaign,
} from '@/types/supabase'

// Re-exporting ListCriteria for now, but this could be moved to a more specific file.
import type { ListCriteria } from '@/types/list-builder';
export type { ListCriteria } from '@/types/list-builder';

// Payload types for creating and updating records.
// These provide a clear API for the functions below.
export type CreateMailingListPayload = Pick<MailingList, 'name' | 'description'> & {
  source_criteria?: Record<string, any>
  source_type?: 'upload' | 'list_builder' | 'manual' | 'imported'
};
export type UpdateMailingListPayload = Omit<Partial<MailingList>, 'id' | 'created_by' | 'created_at' | 'user_id' | 'team_id'>;
export type CreateMailingListRecordPayload = Omit<Partial<MailingListRecord>, 'id' | 'created_at' | 'created_by' | 'modified_at' | 'modified_by'> & { mailing_list_id: string };
export type UpdateMailingListRecordPayload = Omit<Partial<MailingListRecord>, 'id' | 'created_at' | 'created_by' | 'mailing_list_id'>;

// =================================================================================
// Mailing List Functions
// =================================================================================

export async function getMailingLists(): Promise<MailingList[]> {
  const supabase = createClient()
  // Try to embed tags if relationships are defined; otherwise fall back gracefully.
  const { data, error } = await supabase
    .from('mailing_lists')
    .select(`
      *,
      tags:mailing_list_tags(tag:tags(*))
    `)
    .order('created_at', { ascending: false })

  if (error) {
    const msg = String((error as any)?.message || error)
    const missingRel = msg.includes('relationship') && msg.includes('mailing_list_tags')
    if (missingRel) {
      const fallback = await supabase
        .from('mailing_lists')
        .select('*')
        .order('created_at', { ascending: false })
      if (fallback.error) throw fallback.error
      return fallback.data || []
    }
    throw error
  }
  return data || []
}

export async function getMailingList(id: string): Promise<MailingList> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_lists')
    .select(`
      *,
      tags:mailing_list_tags(tag:tags(*)),
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
      updated_at: new Date().toISOString()
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

export async function createMailingListRecord(
  mailingListId: string,
  recordData: Omit<MailingListRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<MailingListRecord> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('mailing_list_records')
    .insert({
      ...recordData,
      mailing_list_id: mailingListId,
      usage_count: 0,
      validation_status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  // Update mailing list record count (handled by database trigger)
  
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

  const { error } = await supabase
    .from('mailing_list_records')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function bulkImportRecords(listId: string, records: Partial<MailingListRecord>[]): Promise<MailingListRecord[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const recordsWithMetadata = records.map(record => ({
    ...record,
    mailing_list_id: listId,
    validation_status: 'pending' as const,
    record_data: (record as any).additional_data || {},
    validation_results: {},
    skip_trace_status: 'not_requested' as const,
    skip_trace_data: {},
    times_mailed: 0
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

export async function addTagToRecord(recordId: string, tagId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('record_tags').insert({ mailing_list_record_id: recordId, tag_id: tagId })
  if (error) throw error
}

export async function removeTagFromRecord(recordId: string, tagId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('record_tags').delete().match({ mailing_list_record_id: recordId, tag_id: tagId })
  if (error) throw error
}

// =================================================================================
// Version History Functions
// =================================================================================

export type MailingListVersion = {
  id: string
  mailing_list_id: string
  version_number: number
  name: string
  description?: string
  record_count: number
  criteria?: any
  metadata?: any
  change_description?: string
  created_at: string
}

export async function getListVersionHistory(listId: string): Promise<MailingListVersion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_list_versions')
    .select('*')
    .eq('mailing_list_id', listId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as MailingListVersion[]) || []
}

// =================================================================================
// Other Functions
// =================================================================================

// Note: The 'updateListRecordCount' function was removed because this is now handled
// by a database trigger for better reliability and performance.

// Note: The 'deduplicateRecords' function has been moved to 'mailing-lists-extended.ts'
// to keep this file focused on core CRUD operations.
