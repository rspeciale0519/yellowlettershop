import { createClient } from '@/utils/supabase/client'
import type { MailingListVersion, MailingListAuditLog } from '@/types/supabase'

// =================================================================================
// Version History Functions
// =================================================================================

export async function createSnapshot(
  mailingListId: string,
  snapshotType: 'manual' | 'auto_save' | 'before_dedup' | 'before_merge' | 'before_delete',
  metadata?: Record<string, any>
): Promise<MailingListVersion> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  // Get current mailing list records for snapshot
  const { data: records, error: recordsError } = await supabase
    .from('mailing_list_records')
    .select('*')
    .eq('mailing_list_id', mailingListId)

  if (recordsError) throw recordsError

  // Get next version number
  const { data: latestVersion } = await supabase
    .from('mailing_list_versions')
    .select('version_number')
    .eq('mailing_list_id', mailingListId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (latestVersion?.version_number || 0) + 1

  const { data, error } = await supabase
    .from('mailing_list_versions')
    .insert({
      mailing_list_id: mailingListId,
      version_number: nextVersion,
      snapshot_type: snapshotType,
      metadata,
      record_count: records?.length || 0,
      records_snapshot: records || [], // JSONB compressed snapshot
      created_by: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVersionHistory(mailingListId: string): Promise<MailingListVersion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_list_versions')
    .select('*')
    .eq('mailing_list_id', mailingListId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function restoreFromSnapshot(
  mailingListId: string,
  versionId: string
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  // Get the snapshot data
  const { data: snapshot, error: snapshotError } = await supabase
    .from('mailing_list_versions')
    .select('records_snapshot, version_number')
    .eq('id', versionId)
    .single()

  if (snapshotError) throw snapshotError

  // Create a new snapshot before restore (for undo functionality)
  await createSnapshot(mailingListId, 'before_delete', {
    restored_from_version: snapshot.version_number,
    action: 'restore'
  })

  // Delete current records
  const { error: deleteError } = await supabase
    .from('mailing_list_records')
    .delete()
    .eq('mailing_list_id', mailingListId)

  if (deleteError) throw deleteError

  // Insert restored records
  if (snapshot.records_snapshot && Array.isArray(snapshot.records_snapshot)) {
    const recordsToInsert = snapshot.records_snapshot.map((record: any) => ({
      ...record,
      id: undefined, // Let database generate new IDs
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('mailing_list_records')
      .insert(recordsToInsert)

    if (insertError) throw insertError
  }
}

// =================================================================================
// Audit Log Functions
// =================================================================================

export async function logAction(
  mailingListId: string,
  actionType: 'create' | 'update' | 'delete' | 'dedup' | 'merge' | 'restore',
  beforeData?: Record<string, any>,
  afterData?: Record<string, any>,
  recordId?: string
): Promise<MailingListAuditLog> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('mailing_list_audit_log')
    .insert({
      mailing_list_id: mailingListId,
      record_id: recordId,
      action_type: actionType,
      before_data: beforeData,
      after_data: afterData,
      user_id: user.id,
      session_id: crypto.randomUUID() // Generate session ID for grouping related actions
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAuditLog(
  mailingListId: string,
  limit: number = 50
): Promise<MailingListAuditLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_list_audit_log')
    .select('*')
    .eq('mailing_list_id', mailingListId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getRecordAuditLog(
  recordId: string,
  limit: number = 20
): Promise<MailingListAuditLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mailing_list_audit_log')
    .select('*')
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}
