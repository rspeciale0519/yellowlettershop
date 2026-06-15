import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentTeam } from "@/lib/teams/current-team"
import { buildInviteToken } from "@/lib/teams/invite-token"
import { sendInviteEmail } from "@/lib/email/resend"

/** Revoke a pending invitation (admin/owner only). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const team = await getCurrentTeam()
  if (!team || team.role === "member") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const supabase = await createClient()
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: params.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

/** Resend a pending invitation: refresh token/expiry in place, re-email the link. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const team = await getCurrentTeam()
  if (!team || team.role === "member") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  const supabase = await createClient()
  const token = buildInviteToken()
  const { data: email, error } = await supabase.rpc("resend_invitation", {
    p_invitation_id: params.id,
    p_token: token,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await sendInviteEmail({ email: email as string, mode: "invited", token })
  return NextResponse.json({ ok: true })
}
