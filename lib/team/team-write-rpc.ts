export interface TeamWriteClient {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        eq?: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>
        }
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>
      }
    }
  }
}

export async function rpcCreateTeam(supabase: TeamWriteClient, name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_team_and_owner', { p_name: name })
  if (error) throw new Error(error.message || 'Failed to create team')
  if (typeof data !== 'string' || !data) throw new Error('Failed to create team')
  return data
}

export async function rpcInviteMember(
  supabase: TeamWriteClient,
  teamId: string,
  email: string,
  role: 'admin' | 'member',
  token: string
): Promise<{ mode: 'added' | 'invited'; token?: string }> {
  const { data, error } = await supabase.rpc('invite_member', {
    p_team_id: teamId,
    p_email: email,
    p_role: role,
    p_token: token,
  })
  if (error) throw new Error(error.message || 'Failed to invite team member')
  const result = data as { mode?: string; token?: string } | null
  if (result?.mode !== 'added' && result?.mode !== 'invited') {
    throw new Error('Failed to invite team member')
  }
  return result as { mode: 'added' | 'invited'; token?: string }
}

export async function rpcAddTeamMember(
  supabase: TeamWriteClient,
  teamId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<string> {
  const { data, error } = await supabase.rpc('add_team_member', {
    p_team_id: teamId,
    p_user_id: userId,
    p_role: role,
  })
  if (error) throw new Error(error.message || 'Failed to add team member')
  if (typeof data !== 'string' || !data) throw new Error('Failed to add team member')
  return data
}

export async function rpcAcceptInvitation(supabase: TeamWriteClient, invitationId: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_team_invitation', { p_invitation_id: invitationId })
  if (error) throw new Error('Failed to accept invitation')
  if (typeof data !== 'string' || !data) throw new Error('Failed to accept invitation')
  return data
}

export async function rpcUpdateMemberPermissions(
  supabase: TeamWriteClient,
  teamId: string,
  memberId: string,
  role?: 'admin' | 'member'
): Promise<void> {
  const { error } = await supabase.rpc('update_team_member_permissions', {
    p_team_id: teamId,
    p_member_id: memberId,
    p_role: role ?? null,
  })
  if (error) throw new Error('Failed to update member permissions')
}
