// =================================================================================
// Tag System Utilities
// =================================================================================
// Comprehensive utilities for working with the enhanced tag system

import { Tag, TagCategory, RecordTag, TagCategoryConfig } from '@/types/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// =================================================================================
// System Tag Constants
// =================================================================================

export const SYSTEM_TAG_NAMES = {
  LIST_NAME: 'List Name',
  SOURCE: 'Source',
  QUALITY_SCORE: 'Quality Score',
  CAMPAIGN_TARGET: 'Campaign Target',
} as const;

export const TAG_CATEGORIES = {
  SYSTEM: 'system',
  LIST_MANAGEMENT: 'list_management',
  DEMOGRAPHICS: 'demographics',
  GEOGRAPHY: 'geography',
  CAMPAIGN: 'campaign',
  CUSTOM: 'custom',
} as const;

export const TAG_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  SYSTEM: 'system',
} as const;

// =================================================================================
// Tag Retrieval Functions
// =================================================================================

/**
 * Get all tags available to a user (including system tags)
 */
export async function getUserTags(userId: string, teamId?: string): Promise<Tag[]> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${userId},team_id.eq.${teamId || 'null'}`)
    .order('is_system', { ascending: false })
    .order('sort_order')
    .order('name');

  if (error) {
    console.error('Error fetching user tags:', error);
    return [];
  }

  return data || [];
}

/**
 * Get system tags only
 */
export async function getSystemTags(): Promise<Tag[]> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('is_system', true)
    .order('sort_order')
    .order('name');

  if (error) {
    console.error('Error fetching system tags:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a system tag by name
 */
export async function getSystemTagByName(tagName: string): Promise<Tag | null> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('is_system', true)
    .eq('name', tagName)
    .single();

  if (error) {
    console.error(`Error fetching system tag "${tagName}":`, error);
    return null;
  }

  return data;
}

/**
 * Get tags by category
 */
export async function getTagsByCategory(
  category: TagCategory,
  userId?: string,
  teamId?: string
): Promise<Tag[]> {
  const supabase = createSupabaseServerClient();
  
  let query = supabase
    .from('tags')
    .select('*')
    .eq('category', category);

  if (category !== 'system') {
    // For non-system categories, filter by user/team
    query = query.or(`user_id.eq.${userId || 'null'},team_id.eq.${teamId || 'null'}`);
  }

  const { data, error } = await query
    .order('is_system', { ascending: false })
    .order('sort_order')
    .order('name');

  if (error) {
    console.error(`Error fetching tags for category "${category}":`, error);
    return [];
  }

  return data || [];
}

// =================================================================================
// Tag Creation Functions
// =================================================================================

/**
 * Create a new tag
 */
export async function createTag(tagData: {
  name: string;
  description?: string;
  category?: TagCategory;
  color?: string;
  visibility?: 'public' | 'private';
  userId?: string;
  teamId?: string;
  parentTagId?: string;
  sortOrder?: number;
  metadata?: Record<string, any>;
}): Promise<Tag | null> {
  const supabase = createSupabaseServerClient();

  const insertData = {
    name: tagData.name,
    description: tagData.description,
    category: tagData.category || 'custom',
    color: tagData.color || '#6B7280',
    visibility: tagData.visibility || 'public',
    user_id: tagData.userId,
    team_id: tagData.teamId,
    parent_tag_id: tagData.parentTagId,
    sort_order: tagData.sortOrder || 0,
    metadata: tagData.metadata || {},
    is_system: false,
  };

  const { data, error } = await supabase
    .from('tags')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    return null;
  }

  return data;
}

/**
 * Create a system tag (admin only)
 */
export async function createSystemTag(tagData: {
  name: string;
  description?: string;
  category: TagCategory;
  color?: string;
  sortOrder?: number;
  metadata?: Record<string, any>;
}): Promise<Tag | null> {
  const supabase = createSupabaseServerClient();

  const insertData = {
    name: tagData.name,
    description: tagData.description,
    category: tagData.category,
    color: tagData.color || '#10B981',
    visibility: 'system' as const,
    is_system: true,
    sort_order: tagData.sortOrder || 0,
    metadata: tagData.metadata || {},
    user_id: null,
    team_id: null,
    parent_tag_id: null,
  };

  const { data, error } = await supabase
    .from('tags')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error creating system tag:', error);
    return null;
  }

  return data;
}

// =================================================================================
// Record Tag Functions
// =================================================================================

/**
 * Assign a tag to a record
 */
export async function assignTagToRecord(
  recordId: string,
  tagId: string,
  tagValue?: string,
  assignedBy?: string,
  metadata?: Record<string, any>
): Promise<RecordTag | null> {
  const supabase = createSupabaseServerClient();

  const insertData = {
    record_id: recordId,
    tag_id: tagId,
    tag_value: tagValue,
    assigned_by: assignedBy,
    metadata: metadata || {},
  };

  const { data, error } = await supabase
    .from('record_tags')
    .insert([insertData])
    .select(`
      *,
      tag:tags(*),
      record:mailing_list_records(*)
    `)
    .single();

  if (error) {
    console.error('Error assigning tag to record:', error);
    return null;
  }

  return data;
}

/**
 * Remove a tag from a record
 */
export async function removeTagFromRecord(recordId: string, tagId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from('record_tags')
    .delete()
    .eq('record_id', recordId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error removing tag from record:', error);
    return false;
  }

  return true;
}

/**
 * Get all tags for a record
 */
export async function getRecordTags(recordId: string): Promise<RecordTag[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('record_tags')
    .select(`
      *,
      tag:tags(*)
    `)
    .eq('record_id', recordId)
    .order('tag.is_system', { ascending: false })
    .order('tag.sort_order')
    .order('tag.name');

  if (error) {
    console.error('Error fetching record tags:', error);
    return [];
  }

  return data || [];
}

/**
 * Update a record tag value
 */
export async function updateRecordTagValue(
  recordId: string,
  tagId: string,
  newValue: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const updateData: any = { tag_value: newValue };
  if (metadata) {
    updateData.metadata = metadata;
  }

  const { error } = await supabase
    .from('record_tags')
    .update(updateData)
    .eq('record_id', recordId)
    .eq('tag_id', tagId);

  if (error) {
    console.error('Error updating record tag value:', error);
    return false;
  }

  return true;
}

// =================================================================================
// System Tag Management
// =================================================================================

/**
 * Ensure required system tags are assigned to a record
 */
export async function ensureRequiredTagsForRecord(
  recordId: string,
  listName: string,
  assignedBy?: string
): Promise<boolean> {
  try {
    // Get the List Name system tag
    const listNameTag = await getSystemTagByName(SYSTEM_TAG_NAMES.LIST_NAME);
    if (!listNameTag) {
      console.error('List Name system tag not found');
      return false;
    }

    // Assign or update the List Name tag
    const supabase = createSupabaseServerClient();
    
    const { error } = await supabase
      .from('record_tags')
      .upsert({
        record_id: recordId,
        tag_id: listNameTag.id,
        tag_value: listName,
        assigned_by: assignedBy,
      }, {
        onConflict: 'record_id,tag_id'
      });

    if (error) {
      console.error('Error ensuring required tags:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in ensureRequiredTagsForRecord:', error);
    return false;
  }
}

/**
 * Bulk assign tags to multiple records
 */
export async function bulkAssignTagToRecords(
  recordIds: string[],
  tagId: string,
  tagValue?: string,
  assignedBy?: string
): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const insertData = recordIds.map(recordId => ({
    record_id: recordId,
    tag_id: tagId,
    tag_value: tagValue,
    assigned_by: assignedBy,
    metadata: {},
  }));

  const { error } = await supabase
    .from('record_tags')
    .upsert(insertData, {
      onConflict: 'record_id,tag_id'
    });

  if (error) {
    console.error('Error bulk assigning tags:', error);
    return false;
  }

  return true;
}

// =================================================================================
// Tag Analytics
// =================================================================================

/**
 * Get tag usage statistics
 */
export async function getTagUsageStats(tagId?: string, userId?: string, teamId?: string) {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from('tag_usage_stats')
    .select('*');

  if (tagId) {
    query = query.eq('id', tagId);
  } else {
    // Filter by user/team if no specific tag
    query = query.or(`is_system.eq.true,user_id.eq.${userId || 'null'},team_id.eq.${teamId || 'null'}`);
  }

  const { data, error } = await query.order('usage_count', { ascending: false });

  if (error) {
    console.error('Error fetching tag usage stats:', error);
    return [];
  }

  return data || [];
}

// =================================================================================
// Tag Categories
// =================================================================================

/**
 * Get all tag categories
 */
export async function getTagCategories(): Promise<TagCategoryConfig[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('tag_categories')
    .select('*')
    .order('sort_order')
    .order('name');

  if (error) {
    console.error('Error fetching tag categories:', error);
    return [];
  }

  return data || [];
}

// =================================================================================
// Utility Functions
// =================================================================================

/**
 * Generate a color for a new tag based on category
 */
export function getDefaultColorForCategory(category: TagCategory): string {
  const colorMap: Record<TagCategory, string> = {
    system: '#10B981',     // Green
    list_management: '#3B82F6',  // Blue
    demographics: '#F59E0B',     // Orange
    geography: '#EF4444',        // Red
    campaign: '#8B5CF6',         // Purple
    custom: '#6B7280',           // Gray
  };

  return colorMap[category] || colorMap.custom;
}

/**
 * Validate tag name (check for duplicates, reserved names, etc.)
 */
export async function validateTagName(
  name: string,
  userId?: string,
  teamId?: string,
  excludeTagId?: string
): Promise<{ valid: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();

  // Check for system tags with same name
  let query = supabase
    .from('tags')
    .select('id')
    .eq('name', name);

  if (excludeTagId) {
    query = query.neq('id', excludeTagId);
  }

  // Check system tags first
  const systemQuery = await query.eq('is_system', true);
  if (systemQuery.data && systemQuery.data.length > 0) {
    return { valid: false, error: 'A system tag with this name already exists' };
  }

  // Check user/team tags
  const userQuery = await query
    .eq('is_system', false)
    .or(`user_id.eq.${userId || 'null'},team_id.eq.${teamId || 'null'}`);

  if (userQuery.data && userQuery.data.length > 0) {
    return { valid: false, error: 'A tag with this name already exists in your workspace' };
  }

  return { valid: true };
}

/**
 * Search tags by name
 */
export async function searchTags(
  query: string,
  userId?: string,
  teamId?: string,
  category?: TagCategory
): Promise<Tag[]> {
  const supabase = createSupabaseServerClient();

  let dbQuery = supabase
    .from('tags')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .or(`is_system.eq.true,user_id.eq.${userId || 'null'},team_id.eq.${teamId || 'null'}`);

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data, error } = await dbQuery
    .order('is_system', { ascending: false })
    .order('sort_order')
    .order('name')
    .limit(50);

  if (error) {
    console.error('Error searching tags:', error);
    return [];
  }

  return data || [];
}