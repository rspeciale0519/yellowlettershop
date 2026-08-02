'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Lock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Confirmation gate for the two money moments in the customer flow.
 *
 * Design intent: the amount is the first thing the eye lands on, and the
 * confirm button states its own consequence ("Charge $118.00 and start
 * printing") rather than a generic "Continue" — a mis-tap has to read as a
 * mis-tap. `tone: 'commit'` is reserved for the irreversible capture.
 */

export interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Rendered large above the body copy. Dollars, not cents. */
  amount?: number | null
  amountCaption?: string
  description: React.ReactNode
  /** Short "what happens next" bullets. */
  consequences?: string[]
  confirmLabel: string
  cancelLabel?: string
  /** 'commit' = money leaves the account and production starts. */
  tone?: 'default' | 'commit'
  isPending?: boolean
  onConfirm: () => void
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  amount,
  amountCaption,
  description,
  consequences,
  confirmLabel,
  cancelLabel = 'Go back',
  tone = 'default',
  isPending = false,
  onConfirm,
}: ConfirmActionDialogProps) {
  const isCommit = tone === 'commit'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                isCommit ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              )}
              aria-hidden="true"
            >
              {isCommit ? <AlertTriangle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </span>
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          </div>

          {typeof amount === 'number' && (
            <div className="pt-2 text-left">
              <div
                className={cn(
                  'text-3xl font-semibold tabular-nums tracking-tight',
                  isCommit ? 'text-amber-700' : 'text-gray-900'
                )}
              >
                {formatUsd(amount)}
              </div>
              {amountCaption && (
                <p className="mt-0.5 text-xs text-muted-foreground">{amountCaption}</p>
              )}
            </div>
          )}

          <AlertDialogDescription className="pt-1 text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {consequences && consequences.length > 0 && (
          <ul
            className={cn(
              'space-y-1.5 rounded-md border p-3 text-sm',
              isCommit ? 'border-amber-200 bg-amber-50/60' : 'border-gray-200 bg-gray-50'
            )}
          >
            {consequences.map((item) => (
              <li key={item} className="flex gap-2 text-gray-700">
                <span aria-hidden="true" className="select-none text-gray-400">
                  &bull;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              isCommit && 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-600'
            )}
          >
            {isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
