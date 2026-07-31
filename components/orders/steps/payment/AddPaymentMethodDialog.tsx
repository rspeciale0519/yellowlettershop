'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock } from 'lucide-react'

// Module scope: loadStripe must not re-run per render. Called directly rather
// than via lib/payments/stripe-config, which also constructs the server-side
// Stripe SDK and would drag it into the client bundle.
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the newly saved payment method id so the caller can select it. */
  onAdded: (paymentMethodId: string) => void
}

/** The form itself — must live inside <Elements> to use the Stripe hooks. */
function CardForm({ onAdded, onClose }: { onAdded: (id: string) => void; onClose: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsSaving(true)
    setError(null)

    // redirect: 'if_required' keeps the customer in the wizard; card setups
    // only redirect for 3DS, which Stripe then handles in a modal.
    const result = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })

    if (result.error) {
      // Surface it. A silent failure here is what made this flow look broken.
      setError(result.error.message ?? 'Your card could not be saved. Please try again.')
      setIsSaving(false)
      return
    }

    const paymentMethod = result.setupIntent?.payment_method
    const paymentMethodId =
      typeof paymentMethod === 'string' ? paymentMethod : paymentMethod?.id ?? null

    if (!paymentMethodId) {
      setError('Card was saved but could not be selected. Please reload and pick it from the list.')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onAdded(paymentMethodId)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Your card is stored by Stripe. It is authorized at checkout and only charged
        after you approve your proof.
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isSaving}>
          {isSaving ? 'Saving…' : 'Save card'}
        </Button>
      </div>
    </form>
  )
}

/**
 * Collects a card via Stripe's Payment Element against a SetupIntent, so a
 * first-time customer can attach a payment method without being charged.
 */
export function AddPaymentMethodDialog({ open, onOpenChange, onAdded }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (!open) {
      // Drop the secret on close so re-opening starts a fresh SetupIntent.
      setClientSecret(null)
      setLoadError(null)
      return
    }

    setIsDark(document.documentElement.classList.contains('dark'))

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/payments/setup-intent', { method: 'POST' })
        const body = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(body?.error ?? 'Could not start card setup')
        setClientSecret(body.clientSecret)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not start card setup')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a payment method</DialogTitle>
          <DialogDescription>
            Your card is authorized when you place the order and charged only after you
            approve the proof.
          </DialogDescription>
        </DialogHeader>

        {!stripePromise ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Card payments are not configured. Please contact support.
            </AlertDescription>
          </Alert>
        ) : loadError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: isDark ? 'night' : 'stripe' },
            }}
          >
            <CardForm onAdded={onAdded} onClose={() => onOpenChange(false)} />
          </Elements>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Preparing secure card form…
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
