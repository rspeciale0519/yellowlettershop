'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface FeatureAuthGuardProps {
  children: ReactNode;
  landingPage: ReactNode;
  requireAuth?: boolean;
  redirectToAuth?: boolean;
}

export function FeatureAuthGuard({ 
  children, 
  landingPage, 
  requireAuth = true,
  redirectToAuth = false
}: FeatureAuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user ?? null);
        
        // If redirectToAuth is enabled and no user, redirect to login modal
        if (redirectToAuth && !user && !isLoading) {
          const currentPath = window.location.pathname;
          router.replace(`/?auth=login&redirectedFrom=${encodeURIComponent(currentPath)}`);
          return;
        }
      } catch (error) {
        console.error('Error fetching auth user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Subscribe to auth state changes
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);
    }).data.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase.auth, router, redirectToAuth, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show feature for authenticated users or landing page for unauthenticated users
  if (requireAuth && !user) {
    // If redirectToAuth is enabled, redirect to login modal instead of showing landing page
    if (redirectToAuth) {
      return null; // Will redirect in useEffect
    }
    return <>{landingPage}</>;
  }

  return <>{children}</>;
}