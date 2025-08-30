"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import type { SignupState, AuthState } from "./types"

interface SignupFormProps {
  signupState: SignupState
  authState: AuthState
  showPassword: boolean
  onSignupStateChange: (updates: Partial<SignupState>) => void
  onShowPasswordToggle: () => void
  onSignUp: (e: React.FormEvent) => void
  onSwitchToLogin: () => void
}

export function SignupForm({
  signupState,
  authState,
  showPassword,
  onSignupStateChange,
  onShowPasswordToggle,
  onSignUp,
  onSwitchToLogin,
}: SignupFormProps) {
  return (
    <form onSubmit={onSignUp} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="signup-email"
            type="email"
            placeholder="Email"
            className="pl-10"
            value={signupState.email}
            onChange={(e) => onSignupStateChange({ email: e.target.value })}
            required
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password (min 6 characters)</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="pl-10 pr-10"
            value={signupState.password}
            onChange={(e) => onSignupStateChange({ password: e.target.value })}
            required
            minLength={6}
            autoComplete="new-password"
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id="agree"
          checked={signupState.agree}
          onCheckedChange={(v) => onSignupStateChange({ agree: !!v })}
        />
        <label htmlFor="agree" className="text-sm">I agree to the Terms and Privacy Policy</label>
      </div>
      <Button type="submit" className="w-full" disabled={authState.isLoading || authState.isGoogleLoading}>
        {authState.isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create Account"}
      </Button>
      <div className="text-center">
        <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={onSwitchToLogin}>
          Back to sign in
        </Button>
      </div>
    </form>
  )
}
