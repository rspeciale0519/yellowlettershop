import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { getCurrentTeam } from "@/lib/teams/current-team"

const Patch = z.object({ role: z.enum(["admin", "member"]) })

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const team = await getCurrentTeam()
  if (!team || team.role === "member") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const { role } = Patch.parse(await req.json())
  const supabase = await createClient()
  const { error } = await supabase.rpc("change_member_role", {
    p_team_id: team.teamId,
    p_user_id: params.userId,
    p_role: role,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { userId: string } }) {
  const team = await getCurrentTeam()
  if (!team || team.role === "member") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const supabase = await createClient()
  const { error } = await supabase.rpc("remove_member", { p_team_id: team.teamId, p_user_id: params.userId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
