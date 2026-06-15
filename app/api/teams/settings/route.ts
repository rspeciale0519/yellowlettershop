import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { getCurrentTeam } from "@/lib/teams/current-team"

const Body = z.object({ name: z.string().min(1).max(120) })

export async function PATCH(req: NextRequest) {
  // Owner-only: the teams table RLS ("Team owners can manage teams") permits the
  // owner alone, so an admin's update would silently no-op. Keep the guard aligned.
  const team = await getCurrentTeam()
  if (!team || team.role !== "owner") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const { name } = Body.parse(await req.json())
  const supabase = await createClient()
  const { error } = await supabase.from("teams").update({ name }).eq("id", team.teamId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
