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
    const { data, error } = await supabase.rpc("accept_team_invitation", { p_token: token })
    if (error) {
      console.error("Accept invite failed:", error)
      return NextResponse.json({ error: "Failed to accept invitation" }, { status: 400 })
    }
    return NextResponse.json({ teamId: data }, { status: 200 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    console.error("Accept invite failed:", e)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
