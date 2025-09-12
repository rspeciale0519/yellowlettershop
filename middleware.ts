import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

// Protect dashboard routes at the edge for faster unauthenticated redirects
export async function middleware(req: NextRequest) {
  // Handle common external service requests to prevent 404 logs
  if (req.nextUrl.pathname === '/.identity' || req.nextUrl.pathname === '/current-url') {
    return new NextResponse(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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
    
    // Only redirect if there's definitely no user and no session error
    if (!user && !error?.message?.includes('Auth session missing')) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('auth', 'login')
      url.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    
    // If there's a session missing error, let the request through 
    // and let the dashboard layout handle the error
    if (error?.message?.includes('Auth session missing')) {
      console.debug('Middleware: Session missing error, allowing request through')
    }
  } catch (error) {
    // On any error, let the request through and let the layout handle it
    console.error('Middleware auth error:', error)
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
