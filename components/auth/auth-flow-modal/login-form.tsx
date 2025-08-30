"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { GoogleIcon } from "@/components/icons/google-icon"
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import type { LoginState, AuthState } from "./types"

interface LoginFormProps {
  loginState: LoginState
  authState: AuthState
  showPassword: boolean
  onLoginStateChange: (updates: Partial<LoginState>) => void
  onShowPasswordToggle: () => void
  onEmailLogin: (e: React.FormEvent) => void
  onGoogleLogin: () => void
  onForgotPassword: () => void
  onSwitchToSignup: () => void
}

export function LoginForm({
  loginState,
  authState,
  showPassword,
  onLoginStateChange,
  onShowPasswordToggle,
  onEmailLogin,
  onGoogleLogin,
  onForgotPassword,
  onSwitchToSignup,
}: LoginFormProps) {
  return (
    <div className="space-y-6 py-2">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12"
        onClick={onGoogleLogin}
        disabled={authState.isLoading || authState.isGoogleLoading}
        aria-label="Sign in with Google"
      >
        {authState.isGoogleLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5" />
        )}
        {authState.isGoogleLoading ? "Signing in..." : "Continue with Google"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={onEmailLogin} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={loginState.email}
              onChange={(e) => onLoginStateChange({ email: e.target.value })}
              autoComplete="email"
              required
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={loginState.password}
              onChange={(e) => onLoginStateChange({ password: e.target.value })}
              autoComplete="current-password"
              required
              className="pl-10 pr-10 h-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={onShowPasswordToggle}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={loginState.rememberMe}
              onCheckedChange={(checked) => onLoginStateChange({ rememberMe: !!checked })}
            />
            <Label htmlFor="remember-me" className="text-sm">Remember me</Label>
          </div>
          <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={onForgotPassword}>
            Forgot password?
          </Button>
        </div>

        <Button type="submit" className="w-full h-12" disabled={authState.isLoading || authState.isGoogleLoading}>
          {authState.isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm">
          Don't have an account?{" "}
          <Button type="button" variant="link" className="p-0 h-auto text-sm font-semibold" onClick={onSwitchToSignup}>
            Create Account
          </Button>
        </p>
      </div>
    </div>
  )
}
