"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

interface VerifyFormProps {
  onSwitchToLogin: () => void
}

export function VerifyForm({ onSwitchToLogin }: VerifyFormProps) {
  return (
    <div className="space-y-4 py-2">
      <Alert>
        <AlertDescription className="flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Your email has been verified.
        </AlertDescription>
      </Alert>
      <Button className="w-full" onClick={onSwitchToLogin}>
        Sign in
      </Button>
    </div>
  )
}
