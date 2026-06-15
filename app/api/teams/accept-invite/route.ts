import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

const Body = z.object({ token: z.string().min(10) })

export async function POST(req: NextRequest) {
  try {
    const { token } = Body.parse(await req.json())
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await supabase.rpc("accept_invite", { p_token: token, p_email: user.email })
    if (error) {
      const msg = error.message
      const code = /expired|invalid|mismatch/.test(msg) ? 400 : /already on a team/.test(msg) ? 409 : 500
      return NextResponse.json({ error: msg }, { status: code })
    }
    return NextResponse.json({ teamId: data }, { status: 200 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
