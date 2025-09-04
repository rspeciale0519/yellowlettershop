/**
 * Time-Based Access Control Service
 * Handles expiring permissions, access requests, and permission templates
 */

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseClient } from '@/lib/supabase/client'

export type AccessRequestStatus = 'pending' | 'approved' | 'denied' | 'expired' | 'withdrawn'
export type PermissionLevel = 'view_only' | 'edit' | 'admin' | 'owner'
export type ResourceType = 'mailing_list' | 'template' | 'design' | 'contact_card' | 'asset'

export interface AccessRequest {
  id: string
  requester_id: string
  resource_type: ResourceType
  resource_id: string
  requested_permission: PermissionLevel
  justification?: string
  requested_duration_days?: number
  status: AccessRequestStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface PermissionTemplate {
  id: string
  created_by: string
  team_id?: string
  name: string
  description?: string
  template_permissions: TemplatePermission[]
  is_active: boolean
  usage_count: number
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface TemplatePermission {
  resource_type: ResourceType
  resource_id: string
  permission_level: PermissionLevel
  duration_days?: number
}

export interface TeamActivity {
  id: string
  team_id: string
  actor_id: string
  action_type: string
  target_user_id?: string
  resource_type?: ResourceType
  resource_id?: string
  permission_level?: PermissionLevel
  duration_days?: number
  metadata: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

/**
 * Server-side time-based permissions service
 */
export class TimeBasedPermissionsService {
  private supabase = createSupabaseServerClient()

  /**
   * Create an access request
   */
  async createAccessRequest(data: {
    resource_type: ResourceType
    resource_id: string
    requested_permission: PermissionLevel
    justification?: string
    requested_duration_days?: number
  }): Promise<AccessRequest> {
    const { data: request, error } = await this.supabase
      .from('access_requests')
      .insert({
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        requested_permission: data.requested_permission,
        justification: data.justification,
        requested_duration_days: data.requested_duration_days,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return request
  }

  /**
   * Get access requests for a team (managers only)
   */
  async getTeamAccessRequests(teamId: string, status?: AccessRequestStatus): Promise<AccessRequest[]> {
    let query = this.supabase
      .from('access_requests')
      .select(`
        *,
        requester:auth.users!requester_id(email, raw_user_meta_data),
        reviewer:auth.users!reviewed_by(email, raw_user_meta_data)
      `)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get user's own access requests
   */
  async getUserAccessRequests(userId: string): Promise<AccessRequest[]> {
    const { data, error } = await this.supabase
      .from('access_requests')
      .select('*')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Approve an access request
   */
  async approveAccessRequest(
    requestId: string, 
    reviewerUserId: string, 
    reviewNotes?: string
  ): Promise<void> {
    const { error } = await this.supabase.rpc('approve_access_request', {
      request_id: requestId,
      reviewer_user_id: reviewerUserId,
      review_notes_text: reviewNotes
    })

    if (error) throw error
  }

  /**
   * Deny an access request
   */
  async denyAccessRequest(
    requestId: string, 
    reviewerUserId: string, 
    reviewNotes?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from('access_requests')
      .update({
        status: 'denied',
        reviewed_by: reviewerUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw error
  }

  /**
   * Create a permission template
   */
  async createPermissionTemplate(data: {
    name: string
    description?: string
    team_id?: string
    template_permissions: TemplatePermission[]
  }): Promise<PermissionTemplate> {
    const { data: template, error } = await this.supabase
      .from('permission_templates')
      .insert({
        name: data.name,
        description: data.description,
        team_id: data.team_id,
        template_permissions: data.template_permissions,
        is_active: true,
        usage_count: 0
      })
      .select()
      .single()

    if (error) throw error
    return template
  }

  /**
   * Get permission templates for a team
   */
  async getPermissionTemplates(teamId?: string): Promise<PermissionTemplate[]> {
    const { data, error } = await this.supabase
      .from('permission_templates')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  /**
   * Apply permission template to user
   */
  async applyPermissionTemplate(
    templateId: string, 
    targetUserId: string, 
    appliedByUserId: string
  ): Promise<void> {
    const { error } = await this.supabase.rpc('apply_permission_template', {
      template_id: templateId,
      target_user_id: targetUserId,
      applied_by_user_id: appliedByUserId
    })

    if (error) throw error
  }

  /**
   * Get team activity log
   */
  async getTeamActivityLog(
    teamId: string, 
    limit: number = 50,
    offset: number = 0
  ): Promise<TeamActivity[]> {
    const { data, error } = await this.supabase
      .from('team_activity_log')
      .select(`
        *,
        actor:auth.users!actor_id(email, raw_user_meta_data),
        target_user:auth.users!target_user_id(email, raw_user_meta_data)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  /**
   * Revoke expired permissions (should be called via cron job)
   */
  async revokeExpiredPermissions(): Promise<void> {
    const { error } = await this.supabase.rpc('revoke_expired_permissions')
    if (error) throw error
  }

  /**
   * Get user's permissions with expiration info
   */
  async getUserPermissions(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('resource_permissions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Extend permission expiration
   */
  async extendPermissionExpiration(
    permissionId: string, 
    additionalDays: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('resource_permissions')
      .update({
        expires_at: `now() + interval '${additionalDays} days'`
      })
      .eq('id', permissionId)

    if (error) throw error
  }
}

/**
 * Client-side time-based permissions service
 */
export class ClientTimeBasedPermissionsService {
  private supabase = createSupabaseClient()

  async createAccessRequest(data: {
    resource_type: ResourceType
    resource_id: string
    requested_permission: PermissionLevel
    justification?: string
    requested_duration_days?: number
  }): Promise<AccessRequest> {
    const { data: request, error } = await this.supabase
      .from('access_requests')
      .insert({
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        requested_permission: data.requested_permission,
        justification: data.justification,
        requested_duration_days: data.requested_duration_days,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return request
  }

  async getUserAccessRequests(): Promise<AccessRequest[]> {
    const { data, error } = await this.supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async withdrawAccessRequest(requestId: string): Promise<void> {
    const { error } = await this.supabase
      .from('access_requests')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw error
  }
}

// Export convenience instances
export const timeBasedPermissions = new TimeBasedPermissionsService()
export const clientTimeBasedPermissions = new ClientTimeBasedPermissionsService()
