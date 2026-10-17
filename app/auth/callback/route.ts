import { NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { appOrigin, getSafeInternalPath } from '@/lib/security/safe-redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = getSafeInternalPath(searchParams.get('redirectTo'))

  if (code) {
    const supabase = await createServerClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const base = appOrigin(origin)
        return NextResponse.redirect(`${base}${redirectTo}`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  return NextResponse.redirect(`${appOrigin(origin)}/?auth=login&error=auth_callback_error`)
}
