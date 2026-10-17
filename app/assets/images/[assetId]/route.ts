import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/middleware"
import { resolveImageAccess } from "@/lib/assets/resolve-image-access"
import { createServiceClient } from "@/utils/supabase/service"

async function signedRedirect(filePath: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from("assets").createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Image is unavailable" }, { status: 404 })
  }
  return NextResponse.redirect(data.signedUrl, { status: 302 })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const user = await getAuthenticatedUser(request)
  const { assetId } = await params
  const supabase = createServiceClient()
  const access = await resolveImageAccess(supabase, assetId, user?.id ?? null)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  return signedRedirect(access.filePath)
}
