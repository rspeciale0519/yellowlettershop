import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentTeam } from "@/lib/teams/current-team"

export async function GET() {
  const team = await getCurrentTeam()
  if (!team) return NextResponse.json({ teamId: null, members: [], invitations: [], role: null, maxSeats: null })
  const supabase = await createClient()
  const [members, invitations, teamRow] = await Promise.all([
    supabase.from("team_members").select("user_id, role, status, joined_at").eq("team_id", team.teamId),
    team.role !== "member"
      ? supabase
          .from("team_invitations")
          .select("id, email, role, status, expires_at")
          .eq("team_id", team.teamId)
          .eq("status", "pending")
      : Promise.resolve({ data: [] as unknown[] }),
    supabase.from("teams").select("max_seats").eq("id", team.teamId).maybeSingle(),
  ])
  return NextResponse.json({
    teamId: team.teamId,
    members: members.data ?? [],
    invitations: (invitations as { data: unknown[] }).data ?? [],
    role: team.role,
    maxSeats: teamRow.data?.max_seats ?? null,
  })
}
