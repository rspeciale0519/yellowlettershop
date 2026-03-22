import { NextResponse } from 'next/server'
import { createServerClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  if (code) {
    const supabase = await createServerClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Session established successfully
        const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          // We can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
          return NextResponse.redirect(`${origin}${redirectTo}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
        } else {
          return NextResponse.redirect(`${origin}${redirectTo}`)
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // return the user to an error/login page if something went wrong
  return NextResponse.redirect(`${origin}/?auth=login&error=auth_callback_error`)
}