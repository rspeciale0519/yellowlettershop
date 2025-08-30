import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * useSupabaseClient - React hook to safely initialize Supabase client only on the client side.
 * Returns the Supabase client instance, or null on the server.
 */
export function useSupabaseClient() {
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient());
    }
  }, []);

  return supabase;
}
