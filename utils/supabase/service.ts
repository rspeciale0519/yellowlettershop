import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client that uses the service role key
// IMPORTANT: Never expose the service role key to the browser
export function createServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceClient should only be called on the server side')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey)
}
