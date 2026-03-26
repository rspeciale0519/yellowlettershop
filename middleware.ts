import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

// Protect dashboard routes at the edge for faster unauthenticated redirects
export async function middleware(req: NextRequest) {
  // Prepare a response that we can mutate cookies on if Supabase refreshes the session
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    // If no authenticated user, redirect to login regardless of error type
    if (!user) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('auth', 'login')
      url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  } catch (error) {
    // On any error, redirect to login for security
    console.error('Middleware auth error:', error)
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'login')
    url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
}
