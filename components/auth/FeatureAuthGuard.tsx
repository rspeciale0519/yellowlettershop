'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface FeatureAuthGuardProps {
  children: ReactNode;
  landingPage: ReactNode;
  requireAuth?: boolean;
}

export function FeatureAuthGuard({ 
  children, 
  landingPage, 
  requireAuth = true 
}: FeatureAuthGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {

    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user ?? null);
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

      // Redirect to dashboard on successful sign-in
      if (event === 'SIGNED_IN' && currentUser && !hasRedirected && !isRedirecting) {
        console.log('FeatureAuthGuard: Redirecting to dashboard...');
        setIsRedirecting(true);
        setHasRedirected(true);
        
        // Use replace instead of push to avoid history issues
        router.replace('/dashboard');
        
        // Reset redirecting state after a timeout to prevent infinite loading
        setTimeout(() => {
          setIsRedirecting(false);
        }, 3000);
      }
    }).data.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase.auth, router, hasRedirected, isRedirecting]);

  // Show loading state while checking auth or redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show feature for authenticated users or landing page for unauthenticated users
  if (requireAuth && !user) {
    return <>{landingPage}</>;
  }

  return <>{children}</>;
}