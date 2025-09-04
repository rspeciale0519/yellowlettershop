import { createClient } from '@/utils/supabase/client'
import { Team, TeamMember, TeamInvitation } from '@/types/supabase'
import { recordChange } from '@/lib/version-history/change-tracker'
import { v4 as uuidv4 } from 'uuid'

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

    const teamData = {
      id: uuidv4(),
      name: request.name,
      description: request.description,
      plan: request.plan,
      owner_id: user.id,
      settings: {
        allow_member_invites: true,
        require_approval_for_campaigns: false,
        default_member_permissions: this.getDefaultPermissions('member')
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: team, error: teamError } = await this.supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single()

    if (teamError) throw teamError

    // Add owner as admin member
    const memberData = {
      id: uuidv4(),
      team_id: team.id,
      user_id: user.id,
      role: 'admin' as const,
      permissions: this.getDefaultPermissions('admin'),
      status: 'active' as const,
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: memberError } = await this.supabase
      .from('team_members')
      .insert(memberData)

    if (memberError) throw memberError

    // Update user profile with team_id
    await this.supabase
      .from('user_profiles')
      .update({ team_id: team.id })
      .eq('id', user.id)

    // Record team creation
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

    // Check if user is already a member or has pending invitation
    const { data: existingMember } = await this.supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', request.email) // This would need email-to-user lookup
      .single()

    if (existingMember) {
      throw new Error('User is already a team member')
    }

    const { data: existingInvitation } = await this.supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', teamId)
      .eq('email', request.email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      throw new Error('User already has a pending invitation')
    }

    // Create invitation
    const invitationData = {
      id: uuidv4(),
      team_id: teamId,
      email: request.email,
      role: request.role,
      permissions: request.permissions || this.getDefaultPermissions(request.role),
      invited_by: user.id,
      status: 'pending' as const,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: invitation, error } = await this.supabase
      .from('team_invitations')
      .insert(invitationData)
      .select()
      .single()

    if (error) throw error

    // Send invitation email (would integrate with email service)
    await this.sendInvitationEmail(invitation)

    // Record invitation
    await recordChange('team_invitation', invitation.id, 'create', {
      newValue: invitation,
      description: `Invited ${request.email} to team`
    })

    return invitation
  }

  /**
   * Accepts a team invitation
   */
  async acceptInvitation(invitationId: string): Promise<TeamMember> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get invitation
    const { data: invitation, error: inviteError } = await this.supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation')
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired')
    }

    // Check if user email matches invitation
    if (user.email !== invitation.email) {
      throw new Error('Invitation email does not match user email')
    }

    // Create team member
    const memberData = {
      id: uuidv4(),
      team_id: invitation.team_id,
      user_id: user.id,
      role: invitation.role,
      permissions: invitation.permissions,
      status: 'active' as const,
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: member, error: memberError } = await this.supabase
      .from('team_members')
      .insert(memberData)
      .select()
      .single()

    if (memberError) throw memberError

    // Update invitation status
    await this.supabase
      .from('team_invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    // Update user profile with team_id
    await this.supabase
      .from('user_profiles')
      .update({ team_id: invitation.team_id })
      .eq('id', user.id)

    // Record acceptance
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

    const updateData: any = {
      permissions,
      updated_at: new Date().toISOString()
    }

    if (role) {
      updateData.role = role
    }

    const { error } = await this.supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
      .eq('team_id', teamId)

    if (error) throw error

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
