export function allowPublicAssetUpload(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function escapePostgrestSearch(value: string): string {
  return value.replace(/[,()\\.%_*"']/g, '').replace(/\s+/g, ' ').trim().slice(0, 80)
}

export async function resolveVerifiedTeamId(
  supabase: { from: (table: string) => any },
  userId: string,
  teamId: string | null
): Promise<string | null> {
  if (!teamId) return null
  const { data, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error || !data?.id) {
    throw new Error('Not a member of the requested team')
  }
  return teamId
}
