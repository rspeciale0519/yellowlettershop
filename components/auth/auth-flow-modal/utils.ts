import { useMemo } from 'react';
import type { AuthMode } from './types';

export const useAuthModalContent = (mode: AuthMode) => {
  const title = useMemo(() => {
    switch (mode) {
      case 'signup':
        return 'Create your account';
      case 'forgot':
        return 'Forgot password';
      case 'reset':
        return 'Set a new password';
      case 'verify':
        return 'Email verified';
      case 'change':
        return 'Change password';
      default:
        return 'Welcome Back';
    }
  }, [mode]);

  const description = useMemo(() => {
    switch (mode) {
      case 'signup':
        return 'Start using Yellow Letter Shop';
      case 'forgot':
        return "Enter your email and we'll send a reset link";
      case 'reset':
        return 'Enter and confirm your new password';
      case 'verify':
        return "You're good to go. Sign in to continue.";
      case 'change':
        return 'Update your password';
      default:
        return 'Sign in to your Yellow Letter Shop account to continue';
    }
  }, [mode]);

  return { title, description };
};

export const getDestinationAfterAuth = (
  redirectedFrom?: string | null
): string => {
  const path = redirectedFrom?.trim();
  if (!path || !path.startsWith('/') || path.startsWith('//'))
    return '/dashboard';
  return path;
};
