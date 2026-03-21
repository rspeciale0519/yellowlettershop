import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 * Use only in server-side code for admin operations.
 */
export function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
