import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Project, ProjectMember, UserProject, ProjectRole, RbacResourceType, PermissionAction } from '@/types/supabase'

// =================================================================================
// Project Management Functions
// =================================================================================

/**
 * Create a new project with the current user as owner
 */
export async function createProject(projectData: {
  name: string
  description?: string
  type?: string
  teamId?: string
  isPublic?: boolean
  settings?: Record<string, any>
}): Promise<{ project: Project | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { project: null, error: 'Unauthorized' }
    }

    // Create the project
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        description: projectData.description,
        type: projectData.type || 'general',
        owner_id: user.id,
        team_id: projectData.teamId,
        is_public: projectData.isPublic || false,
        settings: projectData.settings || {}
      }])
      .select(`
        *,
        owner:owner_id (id, display_name, email),
        team:team_id (id, name)
      `)
      .single()

    if (error) {
      return { project: null, error: error.message }
    }

    return { project, error: null }
  } catch (error) {
    return { project: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get projects accessible by the current user
 */
export async function getUserProjects(userId?: string): Promise<{
  projects: UserProject[]
  error: string | null
}> {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get current user if userId not provided
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { projects: [], error: 'Unauthorized' }
      }
      targetUserId = user.id
    }

    // Use the user_projects view for optimized querying
    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      return { projects: [], error: error.message }
    }

    return { projects: projects || [], error: null }
  } catch (error) {
    return { projects: [], error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get a single project with full details
 */
export async function getProject(projectId: string): Promise<{
  project: Project | null
  error: string | null
}> {
  try {
    const supabase = createSupabaseServerClient()

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:owner_id (id, display_name, email),
        team:team_id (id, name),
        members:project_members (
          id,
          user_id,
          role,
          permission_overrides,
          joined_at,
          user:user_id (id, display_name, email)
        ),
        mailing_lists (id, name, status),
        tags (id, name, color)
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      return { project: null, error: error.message }
    }

    return { project, error: null }
  } catch (error) {
    return { project: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =================================================================================
// Project Member Management
// =================================================================================

/**
 * Add a user to a project with a specific role
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole,
  invitedBy?: string
): Promise<{ member: ProjectMember | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient()

    // Get current user if invitedBy not provided
    let inviterId = invitedBy
    if (!inviterId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { member: null, error: 'Unauthorized' }
      }
      inviterId = user.id
    }

    // Use the helper function
    const { data: memberId, error: functionError } = await supabase
      .rpc('add_user_to_project', {
        p_project_id: projectId,
        p_user_id: userId,
        p_role: role,
        p_invited_by: inviterId
      })

    if (functionError) {
      return { member: null, error: functionError.message }
    }

    // Get the created member with relations
    const { data: member, error: fetchError } = await supabase
      .from('project_members')
      .select(`
        *,
        user:user_id (id, display_name, email),
        project:project_id (id, name)
      `)
      .eq('id', memberId)
      .single()

    if (fetchError) {
      return { member: null, error: fetchError.message }
    }

    return { member, error: null }
  } catch (error) {
    return { member: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update a project member's role or permissions
 */
export async function updateProjectMember(
  projectId: string,
  userId: string,
  updates: {
    role?: ProjectRole
    permissionOverrides?: Record<string, Record<string, boolean>>
  }
): Promise<{ member: ProjectMember | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient()

    const updateData: any = {}
    if (updates.role) updateData.role = updates.role
    if (updates.permissionOverrides) updateData.permission_overrides = updates.permissionOverrides

    const { data: member, error } = await supabase
      .from('project_members')
      .update(updateData)
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select(`
        *,
        user:user_id (id, display_name, email),
        project:project_id (id, name)
      `)
      .single()

    if (error) {
      return { member: null, error: error.message }
    }

    return { member, error: null }
  } catch (error) {
    return { member: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Remove a user from a project
 */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient()

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =================================================================================
// Permission Checking Functions
// =================================================================================

/**
 * Check if a user has a specific permission for a resource in a project
 */
export async function checkUserPermission(
  userId: string,
  projectId: string,
  resourceType: RbacResourceType,
  action: PermissionAction
): Promise<{ allowed: boolean; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient()

    const { data: hasPermission, error } = await supabase
      .rpc('user_has_project_permission', {
        p_user_id: userId,
        p_project_id: projectId,
        p_resource_type: resourceType,
        p_action: action
      })

    if (error) {
      return { allowed: false, error: error.message }
    }

    return { allowed: hasPermission || false, error: null }
  } catch (error) {
    return { allowed: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get a user's role in a project
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<{ role: ProjectRole | null; error: string | null }> {
  try {
    const supabase = createSupabaseServerClient()

    const { data: role, error } = await supabase
      .rpc('get_user_project_role', {
        p_user_id: userId,
        p_project_id: projectId
      })

    if (error) {
      return { role: null, error: error.message }
    }

    return { role, error: null }
  } catch (error) {
    return { role: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check multiple permissions at once
 */
export async function checkUserPermissions(
  userId: string,
  projectId: string,
  checks: Array<{ resourceType: RbacResourceType; action: PermissionAction }>
): Promise<{ permissions: Record<string, boolean>; error: string | null }> {
  try {
    const results: Record<string, boolean> = {}

    // Run all permission checks in parallel
    const permissionChecks = checks.map(async ({ resourceType, action }) => {
      const key = `${resourceType}:${action}`
      const { allowed, error } = await checkUserPermission(userId, projectId, resourceType, action)
      
      if (error) {
        throw new Error(`Permission check failed for ${key}: ${error}`)
      }
      
      return { key, allowed }
    })

    const checkResults = await Promise.all(permissionChecks)
    
    for (const { key, allowed } of checkResults) {
      results[key] = allowed
    }

    return { permissions: results, error: null }
  } catch (error) {
    return { permissions: {}, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =================================================================================
// Utility Functions
// =================================================================================

/**
 * Get the current user with authentication
 */
export async function getCurrentUser() {
  const supabase = createSupabaseServerClient()
  return await supabase.auth.getUser()
}

/**
 * Check if current user can perform action on project resource
 */
export async function requirePermission(
  projectId: string,
  resourceType: RbacResourceType,
  action: PermissionAction
): Promise<{ allowed: boolean; error: string | null; userId: string | null }> {
  try {
    const { data: { user }, error: authError } = await getCurrentUser()
    if (authError || !user) {
      return { allowed: false, error: 'Unauthorized', userId: null }
    }

    const { allowed, error } = await checkUserPermission(
      user.id,
      projectId,
      resourceType,
      action
    )

    return { allowed, error, userId: user.id }
  } catch (error) {
    return {
      allowed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: null
    }
  }
}

/**
 * Helper to ensure user has permission or throw error
 */
export async function ensurePermission(
  projectId: string,
  resourceType: RbacResourceType,
  action: PermissionAction
): Promise<string> {
  const { allowed, error, userId } = await requirePermission(projectId, resourceType, action)
  
  if (error) {
    throw new Error(error)
  }
  
  if (!allowed) {
    throw new Error(`Permission denied: ${action} ${resourceType} in project`)
  }
  
  if (!userId) {
    throw new Error('User ID not available')
  }
  
  return userId
}