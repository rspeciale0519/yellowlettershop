/**
 * Enhanced Audit Logger for Team Activities
 * Extends the existing change_history system with team-specific activity tracking
 */

import { createClient } from '@/utils/supabase/server'
import { createClient as createClientClient } from '@/utils/supabase/client'
import type { ResourceType, PermissionLevel } from '@/lib/access-control/time-based-permissions'

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
  | 'permission_template_created'
  | 'permission_template_applied'
  | 'permission_template_updated'
  | 'user_invited'
  | 'user_removed'
  | 'team_settings_updated'
  | 'resource_created'
  | 'resource_updated'
  | 'resource_deleted'
  | 'resource_shared'
  | 'bulk_operation_performed'
  | 'data_exported'
  | 'data_imported'
  | 'login_activity'
  | 'suspicious_activity'

/**
 * Server-side audit logger
 */
export class EnhancedAuditLogger {
  private supabase = createClient()

  /**
   * Log a team activity
   */
  async logActivity(data: {
    team_id: string
    actor_id: string
    action_type: AuditActionType
    target_user_id?: string
    resource_type?: ResourceType
    resource_id?: string
    permission_level?: PermissionLevel
    duration_days?: number
    metadata?: Record<string, any>
    ip_address?: string
    user_agent?: string
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_activity_log')
        .insert({
          team_id: data.team_id,
          actor_id: data.actor_id,
          action_type: data.action_type,
          target_user_id: data.target_user_id,
          resource_type: data.resource_type,
          resource_id: data.resource_id,
          permission_level: data.permission_level,
          duration_days: data.duration_days,
          metadata: data.metadata || {},
          ip_address: data.ip_address,
          user_agent: data.user_agent
        })

      if (error) {
        console.error('Failed to log team activity:', error)
      }
    } catch (error) {
      console.error('Error logging team activity:', error)
    }
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(data: {
    team_id: string
    actor_id: string
    target_user_id: string
    resource_type: ResourceType
    resource_id: string
    action: 'grant' | 'revoke' | 'modify'
    old_permission?: PermissionLevel
    new_permission?: PermissionLevel
    duration_days?: number
    reason?: string
    ip_address?: string
    user_agent?: string
  }): Promise<void> {
    const action_type = data.action === 'grant' ? 'permission_granted' :
                      data.action === 'revoke' ? 'permission_revoked' :
                      'permission_granted' // modify is treated as grant with metadata

    await this.logActivity({
      team_id: data.team_id,
      actor_id: data.actor_id,
      action_type,
      target_user_id: data.target_user_id,
      resource_type: data.resource_type,
      resource_id: data.resource_id,
      permission_level: data.new_permission,
      duration_days: data.duration_days,
      metadata: {
        old_permission: data.old_permission,
        new_permission: data.new_permission,
        reason: data.reason,
        action: data.action
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent
    })
  }

  /**
   * Log bulk operations
   */
  async logBulkOperation(data: {
    team_id: string
    actor_id: string
    operation_type: string
    affected_count: number
    resource_type?: ResourceType
    details: Record<string, any>
    ip_address?: string
    user_agent?: string
  }): Promise<void> {
    await this.logActivity({
      team_id: data.team_id,
      actor_id: data.actor_id,
      action_type: 'bulk_operation_performed',
      resource_type: data.resource_type,
      metadata: {
        operation_type: data.operation_type,
        affected_count: data.affected_count,
        details: data.details
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent
    })
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(data: {
    team_id: string
    actor_id: string
    activity_type: string
    risk_level: 'low' | 'medium' | 'high' | 'critical'
    details: Record<string, any>
    ip_address?: string
    user_agent?: string
  }): Promise<void> {
    await this.logActivity({
      team_id: data.team_id,
      actor_id: data.actor_id,
      action_type: 'suspicious_activity',
      metadata: {
        activity_type: data.activity_type,
        risk_level: data.risk_level,
        details: data.details,
        timestamp: new Date().toISOString()
      },
      ip_address: data.ip_address,
      user_agent: data.user_agent
    })
  }

  /**
   * Get activity logs for a team with filtering
   */
  async getTeamActivityLogs(
    teamId: string,
    filters?: {
      action_types?: AuditActionType[]
      actor_id?: string
      target_user_id?: string
      resource_type?: ResourceType
      date_from?: string
      date_to?: string
      limit?: number
      offset?: number
    }
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

    if (filters?.actor_id) {
      query = query.eq('actor_id', filters.actor_id)
    }

    if (filters?.target_user_id) {
      query = query.eq('target_user_id', filters.target_user_id)
    }

    if (filters?.resource_type) {
      query = query.eq('resource_type', filters.resource_type)
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const limit = filters?.limit || 50
    const offset = filters?.offset || 0

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  }

  /**
   * Get activity summary statistics
   */
  async getActivitySummary(
    teamId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<Record<string, number>> {
    const periodStart = new Date()
    switch (period) {
      case 'day':
        periodStart.setHours(0, 0, 0, 0)
        break
      case 'week':
        periodStart.setDate(periodStart.getDate() - 7)
        break
      case 'month':
        periodStart.setMonth(periodStart.getMonth() - 1)
        break
    }

    const { data, error } = await this.supabase
      .from('team_activity_log')
      .select('action_type')
      .eq('team_id', teamId)
      .gte('created_at', periodStart.toISOString())

    if (error) throw error

    const summary: Record<string, number> = {}
    data?.forEach(row => {
      summary[row.action_type] = (summary[row.action_type] || 0) + 1
    })

    return summary
  }

  /**
   * Get recent activity for a specific user
   */
  async getUserActivity(
    userId: string,
    teamId: string,
    limit: number = 20
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await this.supabase
      .from('team_activity_log')
      .select(`
        *,
        actor:auth.users!actor_id(id, email, raw_user_meta_data),
        target_user:auth.users!target_user_id(id, email, raw_user_meta_data)
      `)
      .eq('team_id', teamId)
      .or(`actor_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

/**
 * Client-side audit logger (limited functionality)
 */
export class ClientAuditLogger {
  private supabase = createClientClient()

  async getTeamActivityLogs(
    teamId: string,
    filters?: {
      action_types?: AuditActionType[]
      limit?: number
      offset?: number
    }
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

// Export convenience instances
export const auditLogger = new EnhancedAuditLogger()
export const clientAuditLogger = new ClientAuditLogger()

/**
 * Utility functions for audit trail formatting
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

  static formatActivityDescription(entry: AuditLogEntry): string {
    const actor = entry.actor?.email || 'Unknown'
    const target = entry.target_user?.email || 'system'
    const action = this.formatActionType(entry.action_type)

    switch (entry.action_type) {
      case 'permission_granted':
        return `${actor} granted ${this.formatPermissionLevel(entry.permission_level!)} access to ${target}`
      case 'permission_revoked':
        return `${actor} revoked access from ${target}`
      case 'access_request_approved':
        return `${actor} approved access request from ${target}`
      case 'permission_template_applied':
        return `${actor} applied permission template to ${target}`
      default:
        return `${actor} performed ${action.toLowerCase()}`
    }
  }

  static getRiskLevelColor(level: string): string {
    switch (level) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
}
