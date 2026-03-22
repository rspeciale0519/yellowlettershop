import { createClient } from '@/utils/supabase/client';
import type { AuthState, LoginState, SignupState, ForgotState, ResetState } from './types';

export class AuthService {
  private supabase = createClient();

  async loginWithEmail(
    loginState: LoginState,
    redirectedFrom?: string,
    onStateChange?: (updates: Partial<AuthState>) => void
  ) {
    onStateChange?.({ isLoading: true, error: null });

    try {
      const { error } = await this.supabase.auth.signInWithPassword({
        email: loginState.email,
        password: loginState.password,
      });

      if (error) {
        onStateChange?.({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      onStateChange?.({ isLoading: false });
      return { success: true, redirectTo: redirectedFrom || '/dashboard' };
    } catch (error) {
      const errorMsg = 'An unexpected error occurred';
      onStateChange?.({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async loginWithGoogle(
    redirectedFrom?: string,
    onStateChange?: (updates: Partial<AuthState>) => void
  ) {
    onStateChange?.({ isGoogleLoading: true, error: null });
    
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectedFrom || '/dashboard'}`,
        },
      });

      if (error) {
        onStateChange?.({ error: error.message, isGoogleLoading: false });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMsg = 'An unexpected error occurred';
      onStateChange?.({ error: errorMsg, isGoogleLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async signUp(
    signupState: SignupState,
    onStateChange?: (updates: Partial<AuthState>) => void
  ) {
    if (!signupState.agree) {
      onStateChange?.({ error: 'Please agree to the Terms and Conditions' });
      return { success: false, error: 'Please agree to the Terms and Conditions' };
    }

    onStateChange?.({ isLoading: true, error: null });

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: signupState.email,
        password: signupState.password,
      });

      if (error) {
        onStateChange?.({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      } 
      
      if (data?.user && !data.user.email_confirmed_at) {
        onStateChange?.({ 
          message: 'Please check your email for verification link.', 
          error: null,
          isLoading: false 
        });
        return { success: true, needsVerification: true };
      }

      onStateChange?.({ isLoading: false });
      return { success: true, redirectTo: '/dashboard' };
    } catch (error) {
      const errorMsg = 'An unexpected error occurred';
      onStateChange?.({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async resetPassword(
    forgotState: ForgotState,
    onStateChange?: (updates: Partial<AuthState>) => void
  ) {
    onStateChange?.({ isLoading: true, error: null });

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(forgotState.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        onStateChange?.({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      onStateChange?.({ 
        message: 'Password reset email sent! Check your inbox.', 
        error: null,
        isLoading: false 
      });
      return { success: true };
    } catch (error) {
      const errorMsg = 'An unexpected error occurred';
      onStateChange?.({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  async updatePassword(
    resetState: ResetState,
    onStateChange?: (updates: Partial<AuthState>) => void
  ) {
    if (resetState.newPassword !== resetState.confirmPassword) {
      onStateChange?.({ error: 'Passwords do not match' });
      return { success: false, error: 'Passwords do not match' };
    }

    onStateChange?.({ isLoading: true, error: null });

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: resetState.newPassword,
      });

      if (error) {
        onStateChange?.({ error: error.message, isLoading: false });
        return { success: false, error: error.message };
      }

      onStateChange?.({ 
        message: 'Password updated successfully!', 
        error: null,
        isLoading: false 
      });
      return { success: true, redirectTo: '/dashboard' };
    } catch (error) {
      const errorMsg = 'An unexpected error occurred';
      onStateChange?.({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}