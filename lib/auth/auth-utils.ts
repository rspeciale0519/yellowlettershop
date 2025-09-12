import { createClient } from '@/utils/supabase/client';

/**
 * Utility functions for authentication checks and auth flow management
 */

/**
 * Check if user is authenticated
 * @returns Promise<boolean> - true if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Trigger authentication modal with specified mode
 * @param mode - Authentication mode ('login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'change')
 * @param router - Next.js router instance
 * @param redirectPath - Optional path to redirect to after authentication
 */
export function triggerAuthModal(
  mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify' | 'change',
  router: any,
  redirectPath?: string
) {
  const url = new URL(window.location.href);
  url.searchParams.set('auth', mode);
  
  if (redirectPath) {
    url.searchParams.set('redirectedFrom', redirectPath);
  }
  
  router.replace(url.pathname + '?' + url.searchParams.toString(), {
    scroll: false,
  });
}

/**
 * Handle protected action - either execute if authenticated or show auth modal
 * @param action - Function to execute if authenticated
 * @param router - Next.js router instance
 * @param authMode - Authentication mode to show if not authenticated (default: 'login')
 * @param redirectPath - Optional path to redirect to after authentication
 */
export async function handleProtectedAction(
  action: () => void | Promise<void>,
  router: any,
  authMode: 'login' | 'signup' = 'login',
  redirectPath?: string
) {
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    await action();
  } else {
    triggerAuthModal(authMode, router, redirectPath);
  }
}
