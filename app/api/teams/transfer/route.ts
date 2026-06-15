import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { getCurrentTeam } from "@/lib/teams/current-team"

const Body = z.object({ newOwnerId: z.string().uuid() })

export async function POST(req: NextRequest) {
  const team = await getCurrentTeam()
  if (!team || team.role !== "owner") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const { newOwnerId } = Body.parse(await req.json())
  const supabase = await createClient()
  const { error } = await supabase.rpc("transfer_ownership", { p_team_id: team.teamId, p_new_owner: newOwnerId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
