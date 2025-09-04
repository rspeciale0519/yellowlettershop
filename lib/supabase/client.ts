// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client for React components.
// Uses NEXT_PUBLIC_* so it’s safe to expose to the client.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
