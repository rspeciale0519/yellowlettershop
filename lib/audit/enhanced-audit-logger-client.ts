/**
 * Client-side Enhanced Audit Logger for Team Activities
 * Handles team activity logs on the client side
 */

import { createClient } from '@/utils/supabase/client'
import type { ResourceType, PermissionLevel } from '@/lib/access-control/time-based-permissions-client'

export interface AuditLogEntry {
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

export type AuditActionType = 
  | 'permission_granted'
  | 'permission_revoked'
  | 'permission_auto_revoked'
  | 'access_request_created'
  | 'access_request_approved'
  | 'access_request_denied'
  | 'access_request_withdrawn'
  | 'template_created'
  | 'template_updated'
  | 'template_deleted'
  | 'template_applied'
  | 'role_changed'
  | 'team_member_added'
  | 'team_member_removed'

export interface ActivityFilters {
  action_types?: AuditActionType[]
  limit?: number
  offset?: number
}

/**
 * Client-side audit logger for reading team activity logs
 */
export class ClientAuditLogger {
  private supabase = createClient()

  async getTeamActivityLogs(
    teamId: string,
    filters?: ActivityFilters
  ): Promise<AuditLogEntry[]> {
    let query = this.supabase
      .from('team_activity_log')
      .select(`
        *,
        actor:auth.users!actor_id(id, email, raw_user_meta_data),
        target_user:auth.users!target_user_id(id, email, raw_user_meta_data)
      `)
      .eq('team_id', teamId)

    if (filters?.action_types?.length) {
      query = query.in('action_type', filters.action_types)
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }
}

export const clientAuditLogger = new ClientAuditLogger()

/**
 * Utility class for formatting audit trail data
 */
export class AuditTrailFormatter {
  static formatActionType(actionType: string): string {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  static formatPermissionLevel(level: PermissionLevel): string {
    switch (level) {
      case 'view_only': return 'View Only'
      case 'edit': return 'Edit'
      case 'admin': return 'Admin'
      case 'owner': return 'Owner'
      default: return level
    }
  }

  static formatResourceType(type: ResourceType): string {
    switch (type) {
      case 'mailing_list': return 'Mailing List'
      case 'template': return 'Template'
      case 'design': return 'Design'
      case 'contact_card': return 'Contact Card'
      case 'asset': return 'Asset'
      default: return type
    }
  }
}