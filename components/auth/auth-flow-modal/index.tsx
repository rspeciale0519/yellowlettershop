'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Import form components
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { ForgotPasswordForm } from './forgot-password-form';
import { ResetPasswordForm } from './reset-password-form';
import { VerifyForm } from './verify-form';

// Import types and services
import type { 
  AuthMode, 
  AuthState, 
  LoginState, 
  SignupState, 
  ForgotState, 
  ResetState 
} from './types';
import { AuthService } from './auth-service';

const AUTH_MODES: AuthMode[] = ['login', 'signup', 'forgot', 'reset', 'verify', 'change'];
const isAuthMode = (value: any): value is AuthMode => AUTH_MODES.includes(value);

interface AuthFlowModalControllerProps {}

export function AuthFlowModalController({}: AuthFlowModalControllerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authService = useMemo(() => new AuthService(), []);

  // Modal state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Auth state
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    isGoogleLoading: false,
    error: null,
    message: null,
  });

  // Form states
  const [loginState, setLoginState] = useState<LoginState>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [signupState, setSignupState] = useState<SignupState>({
    email: '',
    password: '',
    agree: false,
  });

  const [forgotState, setForgotState] = useState<ForgotState>({
    email: '',
  });

  const [resetState, setResetState] = useState<ResetState>({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
  });

  const redirectedFrom = searchParams.get('redirectedFrom') || undefined;

  // Modal control
  useEffect(() => {
    const incomingValue = searchParams.get('auth');
    const incoming: AuthMode | '' = isAuthMode(incomingValue) ? incomingValue : '';
    
    if (incoming) {
      setMode(incoming);
      setIsOpen(true);
      setAuthState(prev => ({ ...prev, error: null, message: null }));
    } else {
      setIsOpen(false);
    }
  }, [searchParams]);

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('redirectedFrom');
      router.replace(url.pathname + url.search);
    }
  };

  // Auth handlers using AuthService
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authService.loginWithEmail(
      loginState,
      redirectedFrom,
      (updates) => setAuthState(prev => ({ ...prev, ...updates }))
    );

    if (result.success && result.redirectTo) {
      setIsOpen(false);
      router.push(result.redirectTo);
    }
  };

  const handleGoogleLogin = async () => {
    await authService.loginWithGoogle(
      redirectedFrom,
      (updates) => setAuthState(prev => ({ ...prev, ...updates }))
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authService.signUp(
      signupState,
      (updates) => setAuthState(prev => ({ ...prev, ...updates }))
    );

    if (result.success) {
      if (result.needsVerification) {
        setMode('verify');
      } else if (result.redirectTo) {
        setIsOpen(false);
        router.push(result.redirectTo);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.resetPassword(
      forgotState,
      (updates) => setAuthState(prev => ({ ...prev, ...updates }))
    );
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await authService.updatePassword(
      resetState,
      (updates) => setAuthState(prev => ({ ...prev, ...updates }))
    );

    if (result.success && result.redirectTo) {
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      router.replace(url.pathname + url.search);
      router.push(result.redirectTo);
    }
  };

  // Modal content
  const title = useMemo(() => {
    switch (mode) {
      case 'login': return 'Welcome back';
      case 'signup': return 'Create your account';
      case 'forgot': return 'Reset your password';
      case 'reset': return 'Set new password';
      case 'verify': return 'Check your email';
      case 'change': return 'Change password';
      default: return 'Welcome';
    }
  }, [mode]);

  const description = useMemo(() => {
    switch (mode) {
      case 'login': return 'Sign in to your account to continue';
      case 'signup': return 'Get started with your free account';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Enter your new password';
      case 'verify': return 'We sent a verification link to your email';
      case 'change': return 'Update your account password';
      default: return '';
    }
  }, [mode]);

  // Auth state change handler
  useEffect(() => {
    let isInitialLoad = true;

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Only redirect on actual sign-ins, not token refreshes
        // Check if auth modal is open or if this is a fresh sign-in
        if (isOpen || isInitialLoad) {
          setIsOpen(false);
          // Always redirect to dashboard unless user was redirected from a specific page
          const targetUrl = redirectedFrom || '/dashboard';
          // Use window.location for more reliable redirect during auth state changes
          window.location.href = targetUrl;
        }
      } else if (event === 'SIGNED_OUT' && pathname.startsWith('/dashboard')) {
        router.push('/');
      }

      // After first auth state change, mark as no longer initial load
      if (isInitialLoad) {
        isInitialLoad = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname, redirectedFrom, isOpen]);

  // Render form based on mode
  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            loginState={loginState}
            authState={authState}
            showPassword={showPassword}
            onLoginStateChange={(updates) => setLoginState(prev => ({ ...prev, ...updates }))}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onEmailLogin={handleEmailLogin}
            onGoogleLogin={handleGoogleLogin}
            onForgotPassword={() => setMode('forgot')}
            onSwitchToSignup={() => setMode('signup')}
          />
        );
      
      case 'signup':
        return (
          <SignupForm
            signupState={signupState}
            authState={authState}
            showPassword={showPassword}
            onSignupStateChange={(updates) => setSignupState(prev => ({ ...prev, ...updates }))}
            onShowPasswordToggle={() => setShowPassword(!showPassword)}
            onSignup={handleSignup}
            onGoogleLogin={handleGoogleLogin}
            onSwitchToLogin={() => setMode('login')}
          />
        );
      
      case 'forgot':
        return (
          <ForgotPasswordForm
            forgotState={forgotState}
            authState={authState}
            onForgotStateChange={(updates) => setForgotState(prev => ({ ...prev, ...updates }))}
            onSubmit={handleForgotPassword}
            onBackToLogin={() => setMode('login')}
          />
        );
      
      case 'reset':
        return (
          <ResetPasswordForm
            resetState={resetState}
            authState={authState}
            onResetStateChange={(updates) => setResetState(prev => ({ ...prev, ...updates }))}
            onSubmit={handleResetPassword}
            onBackToLogin={() => setMode('login')}
          />
        );
      
      case 'verify':
        return (
          <VerifyForm
            authState={authState}
            onBackToLogin={() => setMode('login')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose} modal={false}>
      <DialogContent className="sm:max-w-md w-full mx-4" aria-describedby="auth-description">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center">
            {title}
          </DialogTitle>
          <DialogDescription id="auth-description" className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Status messages */}
        {authState.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authState.error}</AlertDescription>
          </Alert>
        )}
        {authState.message && (
          <Alert className="mb-4">
            <AlertDescription>{authState.message}</AlertDescription>
          </Alert>
        )}

        {/* Render appropriate form */}
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}