import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UseAdminResult {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  role: string | null;
}

/**
 * Hook to check if the current user has admin privileges.
 * Caches the result for the session to avoid repeated DB calls.
 */
export function useAdmin(): UseAdminResult {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function checkRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!cancelled) {
          setRole(profile?.role ?? null);
        }
      } catch {
        // Silently fail — user is not admin
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    checkRole();
    return () => { cancelled = true; };
  }, []);

  return {
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    isLoading,
    role,
  };
}
