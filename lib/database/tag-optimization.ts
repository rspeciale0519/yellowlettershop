/**
 * Tag-Based Query Optimization Service
 * Provides optimized functions for tag-based database operations
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface TagUsageStats {
  tag_name: string
  usage_count: number
  percentage: number
}

export interface TagSearchOptions {
  mailingListId?: string
  requiredTags?: string[]
  optionalTags?: string[]
  excludedTags?: string[]
  limit?: number
  offset?: number
}

export interface TaggedRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  tags: string[]
  completeness_score: number
}

export interface UntaggedRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  mailing_list_id: string
}

/**
 * Get tag usage statistics for a user
 */
export async function getTagUsageStats(userId: string): Promise<TagUsageStats[]> {
  const supabase = createSupabaseServerClient()
  
  const { data, error } = await supabase.rpc('get_tag_usage_stats', {
    p_user_id: userId
  })

  if (error) {
    console.error('Error fetching tag usage stats:', error)
    throw new Error('Failed to fetch tag usage statistics')
  }

  return data || []
}

/**
 * Search records by tags using optimized database function
 */
export async function searchRecordsByTags(
  userId: string,
  options: TagSearchOptions = {}
): Promise<TaggedRecord[]> {
  const supabase = createSupabaseServerClient()
  
  const {
    mailingListId,
    requiredTags,
    optionalTags,
    excludedTags,
    limit = 100,
    offset = 0
  } = options

  const { data, error } = await supabase.rpc('search_records_by_tags', {
    p_user_id: userId,
    p_mailing_list_id: mailingListId || null,
    p_required_tags: requiredTags || null,
    p_optional_tags: optionalTags || null,
    p_excluded_tags: excludedTags || null,
    p_limit: limit,
    p_offset: offset
  })

  if (error) {
    console.error('Error searching records by tags:', error)
    throw new Error('Failed to search records by tags')
  }

  return (data || []).map((record: any) => ({
    ...record,
    tags: record.tags ? (Array.isArray(record.tags) ? record.tags : JSON.parse(record.tags)) : []
  }))
}

/**
 * Get untagged records for cleanup operations
 */
export async function getUntaggedRecords(
  userId: string,
  mailingListId?: string,
  limit: number = 100
): Promise<UntaggedRecord[]> {
  const supabase = createSupabaseServerClient()
  
  const { data, error } = await supabase.rpc('get_untagged_records', {
    p_user_id: userId,
    p_mailing_list_id: mailingListId || null,
    p_limit: limit
  })

  if (error) {
    console.error('Error fetching untagged records:', error)
    throw new Error('Failed to fetch untagged records')
  }

  return data || []
}

/**
 * Bulk add tags to records
 */
export async function bulkAddTags(
  recordIds: string[],
  tagsToAdd: string[],
  userId: string
): Promise<{ success: boolean; updatedCount: number }> {
  const supabase = createSupabaseServerClient()
  
  // Get current records with their tags
  const { data: records, error: fetchError } = await supabase
    .from('mailing_list_records')
    .select('id, tags')
    .in('id', recordIds)
    .eq('user_id', userId)

  if (fetchError) {
    throw new Error('Failed to fetch records for tag update')
  }

  if (!records || records.length === 0) {
    return { success: true, updatedCount: 0 }
  }

  // Prepare updates
  const updates = records.map(record => {
    const currentTags = record.tags ? (Array.isArray(record.tags) ? record.tags : []) : []
    const newTags = [...new Set([...currentTags, ...tagsToAdd])] // Remove duplicates
    
    return {
      id: record.id,
      tags: newTags,
      updated_at: new Date().toISOString()
    }
  })

  // Perform bulk update
  const { error: updateError } = await supabase
    .from('mailing_list_records')
    .upsert(updates, { onConflict: 'id' })

  if (updateError) {
    throw new Error('Failed to update record tags')
  }

  return { success: true, updatedCount: updates.length }
}

/**
 * Bulk remove tags from records
 */
export async function bulkRemoveTags(
  recordIds: string[],
  tagsToRemove: string[],
  userId: string
): Promise<{ success: boolean; updatedCount: number }> {
  const supabase = createSupabaseServerClient()
  
  // Get current records with their tags
  const { data: records, error: fetchError } = await supabase
    .from('mailing_list_records')
    .select('id, tags')
    .in('id', recordIds)
    .eq('user_id', userId)

  if (fetchError) {
    throw new Error('Failed to fetch records for tag removal')
  }

  if (!records || records.length === 0) {
    return { success: true, updatedCount: 0 }
  }

  // Prepare updates
  const updates = records.map(record => {
    const currentTags = record.tags ? (Array.isArray(record.tags) ? record.tags : []) : []
    const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag))
    
    return {
      id: record.id,
      tags: newTags,
      updated_at: new Date().toISOString()
    }
  })

  // Perform bulk update
  const { error: updateError } = await supabase
    .from('mailing_list_records')
    .upsert(updates, { onConflict: 'id' })

  if (updateError) {
    throw new Error('Failed to remove record tags')
  }

  return { success: true, updatedCount: updates.length }
}

/**
 * Get records by specific tag with pagination
 */
export async function getRecordsByTag(
  userId: string,
  tag: string,
  mailingListId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ records: TaggedRecord[]; total: number }> {
  const supabase = createSupabaseServerClient()
  
  let query = supabase
    .from('mailing_list_records')
    .select(`
      id,
      firstName,
      lastName,
      email,
      phone,
      tags,
      additional_data
    `, { count: 'exact' })
    .eq('user_id', userId)
    .contains('tags', [tag])
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (mailingListId) {
    query = query.eq('mailing_list_id', mailingListId)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error('Failed to fetch records by tag')
  }

  const records = (data || []).map(record => ({
    id: record.id,
    firstName: record.firstName || '',
    lastName: record.lastName || '',
    email: record.email || '',
    phone: record.phone || '',
    tags: record.tags || [],
    completeness_score: record.additional_data?.completeness_score || 0
  }))

  return {
    records,
    total: count || 0
  }
}

/**
 * Get most popular tags for a user
 */
export async function getPopularTags(
  userId: string,
  limit: number = 20
): Promise<TagUsageStats[]> {
  const stats = await getTagUsageStats(userId)
  return stats.slice(0, limit)
}

/**
 * Get tag suggestions based on existing tags
 */
export async function getTagSuggestions(
  userId: string,
  partialTag: string,
  limit: number = 10
): Promise<string[]> {
  const supabase = createSupabaseServerClient()
  
  // Get all unique tags for the user
  const { data, error } = await supabase
    .from('mailing_list_records')
    .select('tags')
    .eq('user_id', userId)
    .not('tags', 'is', null)

  if (error) {
    throw new Error('Failed to fetch tag suggestions')
  }

  // Extract and filter tags
  const allTags = new Set<string>()
  data?.forEach(record => {
    if (record.tags && Array.isArray(record.tags)) {
      record.tags.forEach(tag => {
        if (typeof tag === 'string' && tag.toLowerCase().includes(partialTag.toLowerCase())) {
          allTags.add(tag)
        }
      })
    }
  })

  return Array.from(allTags).slice(0, limit)
}

/**
 * Optimize tag storage by cleaning up unused tags
 */
export async function cleanupUnusedTags(userId: string): Promise<{
  removedTags: string[]
  affectedRecords: number
}> {
  const supabase = createSupabaseServerClient()
  
  // Get all records with tags
  const { data: records, error } = await supabase
    .from('mailing_list_records')
    .select('id, tags')
    .eq('user_id', userId)
    .not('tags', 'is', null)

  if (error) {
    throw new Error('Failed to fetch records for cleanup')
  }

  if (!records || records.length === 0) {
    return { removedTags: [], affectedRecords: 0 }
  }

  // Find empty or invalid tags
  const updates: Array<{ id: string; tags: string[] }> = []
  const removedTags = new Set<string>()

  records.forEach(record => {
    if (record.tags && Array.isArray(record.tags)) {
      const cleanTags = record.tags.filter(tag => {
        if (!tag || typeof tag !== 'string' || tag.trim() === '') {
          removedTags.add(tag)
          return false
        }
        return true
      })

      if (cleanTags.length !== record.tags.length) {
        updates.push({
          id: record.id,
          tags: cleanTags
        })
      }
    }
  })

  // Apply updates if any
  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from('mailing_list_records')
      .upsert(updates.map(update => ({
        ...update,
        updated_at: new Date().toISOString()
      })), { onConflict: 'id' })

    if (updateError) {
      throw new Error('Failed to cleanup tags')
    }
  }

  return {
    removedTags: Array.from(removedTags),
    affectedRecords: updates.length
  }
}
