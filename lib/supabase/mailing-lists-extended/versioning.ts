// Mailing list versioning utilities
import { createClient } from '@/utils/supabase/client'

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
