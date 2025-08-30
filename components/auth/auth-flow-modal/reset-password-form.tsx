"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, Eye, EyeOff } from "lucide-react"
import type { ResetState, AuthState } from "./types"

interface ResetPasswordFormProps {
  resetState: ResetState
  authState: AuthState
  onResetStateChange: (updates: Partial<ResetState>) => void
  onUpdatePassword: (e: React.FormEvent) => void
  onSwitchToLogin: () => void
}

export function ResetPasswordForm({
  resetState,
  authState,
  onResetStateChange,
  onUpdatePassword,
  onSwitchToLogin,
}: ResetPasswordFormProps) {
  return (
    <form onSubmit={onUpdatePassword} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="new-password"
            type={resetState.showPassword ? "text" : "password"}
            placeholder="Enter a new password"
            className="pl-10 pr-10"
            required
            value={resetState.newPassword}
            onChange={(e) => onResetStateChange({ newPassword: e.target.value })}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => onResetStateChange({ showPassword: !resetState.showPassword })}
            aria-label={resetState.showPassword ? "Hide password" : "Show password"}
          >
            {resetState.showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirm-password"
            type={resetState.showPassword ? "text" : "password"}
            placeholder="Confirm your new password"
            className="pl-10 pr-10"
            required
            value={resetState.confirmPassword}
            onChange={(e) => onResetStateChange({ confirmPassword: e.target.value })}
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={authState.isLoading}>
        {authState.isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : "Update Password"}
      </Button>
      <div className="text-center">
        <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={onSwitchToLogin}>
          Back to sign in
        </Button>
      </div>
    </form>
  )
}
