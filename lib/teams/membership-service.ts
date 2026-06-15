import { createClient } from "@/utils/supabase/server"
import { buildInviteToken } from "./invite-token"

export { buildInviteToken }

export type InviteResult = { mode: "added" | "invited"; token?: string }

/** Create the caller's team lazily (first invite) and return its id. */
export async function ensureTeam(name: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_team_and_owner", { p_name: name })
  if (error) throw error
  return data as string
}

/** Invite an email at a role; returns whether the user was added or a link issued. */
export async function inviteMember(
  teamId: string,
  email: string,
  role: "admin" | "member",
): Promise<InviteResult> {
  const supabase = await createClient()
  const token = buildInviteToken()
  const { data, error } = await supabase.rpc("invite_member", {
    p_team_id: teamId,
    p_email: email,
    p_role: role,
    p_token: token,
  })
  if (error) throw error
  return data as InviteResult
}
