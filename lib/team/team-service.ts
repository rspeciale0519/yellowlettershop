import { createClient } from '@/utils/supabase/client'
import { Team, TeamMember, TeamInvitation } from '@/types/supabase'
import { recordChange } from '@/lib/version-history/change-tracker'
import { v4 as uuidv4 } from 'uuid'
import { rpcAcceptInvitation, rpcAddTeamMember, rpcCreateTeam, rpcInviteMember, rpcUpdateMemberPermissions, type TeamWriteClient } from './team-write-rpc'

export interface CreateTeamRequest {
  name: string
  description?: string
  plan: 'team' | 'enterprise'
}

export interface InviteTeamMemberRequest {
  email: string
  role: 'member' | 'admin'
  permissions?: string[]
}

export interface TeamPermissions {
  canManageMembers: boolean
  canManageSettings: boolean
  canCreateCampaigns: boolean
  canManageMailingLists: boolean
  canViewAnalytics: boolean
  canManageVendors: boolean
  canManageAssets: boolean
}

/**
 * Service for managing teams, invitations, and permissions
 */
export class TeamService {
  private supabase = createClient()

  /**
   * Creates a new team
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const teamId = await rpcCreateTeam(this.supabase as unknown as TeamWriteClient, request.name)
    const { data: team, error } = await this.supabase
      .from('teams')
      .select()
      .eq('id', teamId)
      .single()
    if (error || !team) throw error ?? new Error('Team was created but could not be loaded')

    await recordChange('team', team.id, 'create', {
      newValue: team,
      description: `Created team "${request.name}"`
    })

    return team
  }

  /**
   * Invites a user to join a team
   */
  async inviteTeamMember(teamId: string, request: InviteTeamMemberRequest): Promise<TeamInvitation> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user has permission to invite
    const canInvite = await this.checkPermission(user.id, teamId, 'canManageMembers')
    if (!canInvite) {
      throw new Error('Insufficient permissions to invite team members')
    }

    const token = uuidv4()
    const result = await rpcInviteMember(
      this.supabase as unknown as TeamWriteClient,
      teamId,
      request.email,
      request.role,
      token
    )

    const { data: invitation } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('email', request.email)
      .maybeSingle()

    const record = (invitation ?? {
      id: token,
      team_id: teamId,
      email: request.email,
      role: request.role,
      invited_by: user.id,
      status: result.mode === 'added' ? 'accepted' : 'pending',
      token: result.token ?? token,
    }) as TeamInvitation

    if (result.mode === 'invited') {
      await this.sendInvitationEmail(record)
    }

    await recordChange('team_invitation', record.id, 'create', {
      newValue: record,
      description: `Invited ${request.email} to team`
    })

    return record
  }

  /**
   * Adds an existing user to a team (owner/admin RPC).
   */
  async addTeamMember(teamId: string, memberUserId: string, role: 'member' | 'admin' = 'member'): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    await rpcAddTeamMember(this.supabase as unknown as TeamWriteClient, teamId, memberUserId, role)
  }

  /**
   * Accepts a team invitation
   */
  async acceptInvitation(invitationId: string): Promise<TeamMember> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const memberId = await rpcAcceptInvitation(this.supabase as unknown as TeamWriteClient, invitationId)
    const { data: member, error } = await this.supabase
      .from('team_members')
      .select()
      .eq('id', memberId)
      .single()
    if (error || !member) throw new Error('Failed to accept invitation')

    await recordChange('team_member', member.id, 'create', {
      newValue: member,
      description: `${user.email} joined the team`
    })

    return member
  }

  /**
   * Updates team member permissions
   */
  async updateMemberPermissions(
    teamId: string,
    memberId: string,
    permissions: string[],
    role?: 'member' | 'admin'
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user has permission to manage members
    const canManage = await this.checkPermission(user.id, teamId, 'canManageMembers')
    if (!canManage) {
      throw new Error('Insufficient permissions to manage team members')
    }

    await rpcUpdateMemberPermissions(
      this.supabase as unknown as TeamWriteClient,
      teamId,
      memberId,
      role
    )

    // Record permission update
    await recordChange('team_member', memberId, 'update', {
      fieldName: 'permissions',
      newValue: permissions,
      description: `Updated member permissions`
    })
  }

  /**
   * Removes a team member
   */
  async removeMember(teamId: string, memberId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user has permission to manage members
    const canManage = await this.checkPermission(user.id, teamId, 'canManageMembers')
    if (!canManage) {
      throw new Error('Insufficient permissions to remove team members')
    }

    // Get member info before deletion
    const { data: member } = await this.supabase
      .from('team_members')
      .select('user_id')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single()

    if (!member) {
      throw new Error('Team member not found')
    }

    // Remove member
    const { error } = await this.supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId)

    if (error) throw error

    // Update user profile to remove team_id
    await this.supabase
      .from('user_profiles')
      .update({ team_id: null })
      .eq('id', member.user_id)

    // Record removal
    await recordChange('team_member', memberId, 'delete', {
      description: `Removed team member`
    })
  }

  /**
   * Gets team members with their details
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user is a team member
    const isMember = await this.isTeamMember(user.id, teamId)
    if (!isMember) {
      throw new Error('Access denied: not a team member')
    }

    const { data: members, error } = await this.supabase
      .from('team_members')
      .select(`
        *,
        user_profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (error) throw error
    return members || []
  }

  /**
   * Gets pending team invitations
   */
  async getPendingInvitations(teamId: string): Promise<TeamInvitation[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user can manage members
    const canManage = await this.checkPermission(user.id, teamId, 'canManageMembers')
    if (!canManage) {
      throw new Error('Insufficient permissions to view invitations')
    }

    const { data: invitations, error } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return invitations || []
  }

  /**
   * Shares a resource with team members
   */
  async shareResource(
    resourceType: string,
    resourceId: string,
    teamId: string,
    permissions: string[] = ['read']
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if user is team member
    const isMember = await this.isTeamMember(user.id, teamId)
    if (!isMember) {
      throw new Error('Access denied: not a team member')
    }

    // Create resource sharing record
    const shareData = {
      id: uuidv4(),
      resource_type: resourceType,
      resource_id: resourceId,
      team_id: teamId,
      shared_by: user.id,
      permissions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('team_resource_sharing')
      .insert(shareData)

    if (error) throw error

    // Record sharing
    await recordChange('resource_share', shareData.id, 'create', {
      newValue: shareData,
      description: `Shared ${resourceType} with team`
    })
  }

  // Private helper methods

  private async checkPermission(
    userId: string,
    teamId: string,
    permission: keyof TeamPermissions
  ): Promise<boolean> {
    const { data: member } = await this.supabase
      .from('team_members')
      .select('permissions, role')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .single()

    if (!member) return false

    // Admin role has all permissions
    if (member.role === 'admin') return true

    // Check specific permission
    const permissions = member.permissions as string[]
    return permissions.includes(permission)
  }

  private async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    const { data: member } = await this.supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .single()

    return !!member
  }

  private getDefaultPermissions(role: 'member' | 'admin'): string[] {
    if (role === 'admin') {
      return [
        'canManageMembers',
        'canManageSettings',
        'canCreateCampaigns',
        'canManageMailingLists',
        'canViewAnalytics',
        'canManageVendors',
        'canManageAssets'
      ]
    }

    return [
      'canCreateCampaigns',
      'canManageMailingLists',
      'canViewAnalytics'
    ]
  }

  private async sendInvitationEmail(invitation: TeamInvitation): Promise<void> {
    // Placeholder for email service integration
    // Would integrate with service like SendGrid, Mailgun, etc.
    console.log(`Sending invitation email to ${invitation.email}`)
    
    // In production, this would send an actual email with:
    // - Team name
    // - Invitation link
    // - Expiration date
    // - Role and permissions info
  }
}
