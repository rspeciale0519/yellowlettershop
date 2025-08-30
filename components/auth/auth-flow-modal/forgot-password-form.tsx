"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Loader2 } from "lucide-react"
import type { ForgotState, AuthState } from "./types"
import type { FormEvent, ChangeEvent } from "react"

interface ForgotPasswordFormProps {
  forgotState: ForgotState
  authState: AuthState
  onForgotStateChange: (updates: Pick<ForgotState, "email">) => void
  onSendReset: (e: FormEvent<HTMLFormElement>) => void
  onSwitchToLogin: () => void
}

export function ForgotPasswordForm({
  forgotState,
  authState,
  onForgotStateChange,
  onSendReset,
  onSwitchToLogin,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={onSendReset} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="Email"
            className="pl-10"
            value={forgotState.email}
            onChange={(e) => onForgotStateChange({ email: e.target.value })}
            required
            autoComplete="email"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={authState.isLoading}>
        {authState.isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
      </Button>
      <div className="text-center">
        <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={onSwitchToLogin}>
          Back to sign in
        </Button>
      </div>
    </form>
  )
}
