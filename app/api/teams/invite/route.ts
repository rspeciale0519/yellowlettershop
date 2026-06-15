import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentTeam } from "@/lib/teams/current-team"
import { ensureTeam, inviteMember } from "@/lib/teams/membership-service"
import { sendInviteEmail } from "@/lib/email/resend"

const Body = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
  teamName: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { email, role, teamName } = Body.parse(await req.json())
    let team = await getCurrentTeam()
    if (!team) {
      const id = await ensureTeam(teamName ?? "My Team")
      team = { teamId: id, role: "owner" }
    }
    if (team.role === "member") return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    const result = await inviteMember(team.teamId, email, role)
    await sendInviteEmail({ email, mode: result.mode, token: result.token })
    return NextResponse.json(result, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input", details: e.errors }, { status: 400 })
    const msg = e instanceof Error ? e.message : String(e)
    const code = /seat limit/.test(msg)
      ? 409
      : /already belongs|already on a team/.test(msg)
        ? 409
        : /not authorized/.test(msg)
          ? 403
          : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
