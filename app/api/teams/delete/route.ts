import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentTeam } from "@/lib/teams/current-team"

export async function POST() {
  const team = await getCurrentTeam()
  if (!team || team.role !== "owner") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const supabase = await createClient()
  const { error } = await supabase.rpc("delete_team", { p_team_id: team.teamId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
