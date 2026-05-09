import { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { DESIGNER_FONTS } from "@/components/designer/designer-fonts"
import { withAuth } from "@/lib/auth/middleware"
import { createClient } from "@/utils/supabase/service"

const FontSchema = z.object({
  label: z.string().min(1),
  cssFamily: z.string().min(1),
  fontUrl: z.string().url().optional(),
  enabled: z.boolean().optional(),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("designer_fonts")
      .select("id,label,css_family,font_url,enabled")
      .eq("enabled", true)
      .order("label")

    if (error || !data?.length) return NextResponse.json({ fonts: DESIGNER_FONTS })

    return NextResponse.json({
      fonts: data.map((font) => ({
        id: font.id,
        label: font.label,
        cssFamily: font.css_family,
        fontUrl: font.font_url,
        enabled: font.enabled,
      })),
    })
  } catch {
    return NextResponse.json({ fonts: DESIGNER_FONTS })
  }
}

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = FontSchema.parse(await request.json())
    const supabase = createClient()
    const { data, error } = await supabase
      .from("designer_fonts")
      .insert({
        label: body.label,
        css_family: body.cssFamily,
        font_url: body.fontUrl ?? null,
        enabled: body.enabled ?? true,
      })
      .select("id,label,css_family,font_url,enabled")
      .single()

    if (error) throw error
    return NextResponse.json({
      font: {
        id: data.id,
        label: data.label,
        cssFamily: data.css_family,
        fontUrl: data.font_url,
        enabled: data.enabled,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid font data", details: error.errors }, { status: 400 })
    return NextResponse.json({ error: "Unable to create font" }, { status: 500 })
  }
}, { allowedRoles: ["admin"] })
