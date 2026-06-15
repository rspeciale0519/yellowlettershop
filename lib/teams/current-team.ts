import { createClient } from "@/utils/supabase/server"

export type TeamRole = "owner" | "admin" | "member"
export interface CurrentTeam {
  teamId: string
  role: TeamRole
}

/** Resolve the signed-in user's active team + role, or null for a solo user. */
export async function getCurrentTeam(): Promise<CurrentTeam | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()
  return data ? { teamId: data.team_id, role: data.role as TeamRole } : null
}
