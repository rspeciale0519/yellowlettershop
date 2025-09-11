/**
 * SafeAuthenticatedRedirect Component
 * 
 * A safer version that handles auth errors gracefully and only loads after hydration.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface SafeAuthenticatedRedirectProps {
  redirectTo?: string;
}

export function SafeAuthenticatedRedirect({ 
  redirectTo = '/dashboard'
}: SafeAuthenticatedRedirectProps) {
  const [isClient, setIsClient] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run on client side after hydration
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isChecking) return;

    const checkAuthAndRedirect = async () => {
      setIsChecking(true);
      
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // If user is authenticated, redirect to dashboard
        if (user && !error) {
          router.replace(redirectTo);
        }
      } catch (error) {
        // Silently handle errors - just don't redirect
        console.debug('Auth check failed, staying on current page');
      } finally {
        setIsChecking(false);
      }
    };

    // Add a small delay to ensure page is fully loaded
    const timeoutId = setTimeout(checkAuthAndRedirect, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isClient, isChecking, router, redirectTo]);

  // This component doesn't render anything visible
  return null;
}