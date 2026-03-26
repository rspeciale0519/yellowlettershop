/**
 * Client-side Time-Based Access Control Service
 * Handles expiring permissions, access requests, and permission templates on the client
 */

import { createClient } from '@/utils/supabase/client'

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
  created_at: string
  updated_at: string
  reviewed_by?: string
  review_notes?: string
  approved_at?: string
  denied_at?: string
  withdrawn_at?: string
}

export interface TemplatePermission {
  resource_type: ResourceType
  resource_id: string
  permission_level: PermissionLevel
  duration_days?: number
}

export interface PermissionTemplate {
  id: string
  team_id?: string
  name: string
  description?: string
  is_active: boolean
  template_permissions: TemplatePermission[]
  usage_count: number
  created_at: string
  updated_at: string
  created_by: string
}

/**
 * Client-side time-based permissions service
 */
export class ClientTimeBasedPermissionsService {
  private supabase = createClient()

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

export const clientTimeBasedPermissions = new ClientTimeBasedPermissionsService()