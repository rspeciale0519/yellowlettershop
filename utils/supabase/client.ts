import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client for client components and hooks
export function createClient() {
  // This function should only be called on the client
  if (typeof window === 'undefined') {
    throw new Error('createClient should only be called on the client side')
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
