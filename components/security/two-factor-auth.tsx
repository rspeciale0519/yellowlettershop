"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Shield, ShieldCheck, Smartphone } from "lucide-react"
import {
  enrollTotp,
  getVerifiedTotpFactor,
  unenrollTotp,
  verifyTotp,
  type Factor,
  type TotpEnrollment,
} from "@/lib/auth/mfa"

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong"

export function TwoFactorAuth() {
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(true)
  const [activeFactor, setActiveFactor] = useState<Factor | null>(null)
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    try {
      setActiveFactor(await getVerifiedTotpFactor(supabase))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeDialog = async () => {
    if (enrollment) {
      // Abandon a pending (unverified) factor so it doesn't accumulate.
      await unenrollTotp(supabase, enrollment.factorId).catch(() => undefined)
    }
    setEnrollment(null)
    setVerificationCode("")
  }

  const handleEnroll = async () => {
    try {
      setBusy(true)
      setEnrollment(await enrollTotp(supabase))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async () => {
    if (!enrollment) return
    try {
      setBusy(true)
      await verifyTotp(supabase, enrollment.factorId, verificationCode)
      setEnrollment(null)
      setVerificationCode("")
      toast.success("Two-factor authentication enabled")
      await refresh()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    if (!activeFactor) return
    try {
      setBusy(true)
      await unenrollTotp(supabase, activeFactor.id)
      toast.success("Two-factor authentication disabled")
      await refresh()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking status...
          </div>
        ) : activeFactor ? (
          <>
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Two-factor authentication is enabled</AlertTitle>
              <AlertDescription>
                You&apos;ll be asked for a code from your authenticator app when signing in. Keep
                that app safe&mdash;it is the only way to complete sign-in while 2FA is on.
              </AlertDescription>
            </Alert>
            <Button variant="destructive" onClick={handleDisable} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Disable Two-Factor Authentication
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Authenticator app</Label>
                <p className="text-sm text-muted-foreground">
                  Require a verification code from an authenticator app when signing in.
                </p>
              </div>
              <Button onClick={handleEnroll} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Enable
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <Dialog
        open={enrollment !== null}
        onOpenChange={(open) => {
          if (!open) void closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code it shows.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {enrollment ? (
              // Supabase returns the QR as an inline SVG data URI.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enrollment.qrCode}
                alt="Two-factor authentication QR code"
                className="h-48 w-48 rounded-md border bg-white p-2"
              />
            ) : null}
            <p className="text-sm text-muted-foreground">Can&apos;t scan? Enter this code manually:</p>
            <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm break-all">
              {enrollment?.secret}
            </code>
            <div className="w-full space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => void closeDialog()} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={busy || verificationCode.length !== 6}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <Smartphone className="mr-2 h-4 w-4" />
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
