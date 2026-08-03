// app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  // simple read to prove connectivity
  const { data, error } = await supabase.from('user_profiles').select('id').limit(1)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, data })
}
