/**
 * AuthenticatedRedirect Component
 * 
 * Redirects authenticated users from marketing pages to their dashboard.
 * This ensures logged-in users don't get stuck on the homepage.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface AuthenticatedRedirectProps {
  /** Page to redirect to when authenticated (default: '/dashboard') */
  redirectTo?: string;
  /** Whether to show loading state during redirect */
  showLoading?: boolean;
}

export function AuthenticatedRedirect({ 
  redirectTo = '/dashboard',
  showLoading = false 
}: AuthenticatedRedirectProps) {
  const [hasError, setHasError] = useState(false);
  
  let authState = null;
  let router = null;
  
  try {
    authState = useAuth();
    router = useRouter();
  } catch (error) {
    // Handle auth errors gracefully
    console.warn('Auth redirect error:', error);
    setHasError(true);
  }

  useEffect(() => {
    // Skip if there was an error or missing dependencies
    if (hasError || !authState || !router) return;
    
    const { isAuthenticated, isLoading } = authState;
    
    // Wait for auth state to be determined
    if (isLoading) return;

    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
      router.replace(redirectTo); // Use replace instead of push to avoid back button issues
    }
  }, [authState?.isAuthenticated, authState?.isLoading, router, redirectTo, hasError]);

  // Show loading indicator during redirect if requested
  if (showLoading && authState?.isLoading) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything during redirect (prevents flash)
  if (authState?.isAuthenticated && !authState?.isLoading) {
    return null;
  }
  
  // Return null if there was an error to prevent crashes
  if (hasError) {
    return null;
  }

  // Continue rendering the page for unauthenticated users
  return null;
}