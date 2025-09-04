// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server-side Supabase client for Next.js (App Router).
 * Implements the cookies adapter (get, set, remove) required by @supabase/ssr.
 */
export async function createSupabaseServerClient() {
  // Next.js 15 dynamic APIs require awaiting cookies()
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options?: Parameters<typeof cookieStore.set>[2]) {
          cookieStore.set(name, value, options)
        },
        async remove(name: string, options?: Parameters<typeof cookieStore.set>[1]) {
          // Expire the cookie
          cookieStore.set(name, '', { ...options, expires: new Date(0) })
        },
      },
    }
  )
}
