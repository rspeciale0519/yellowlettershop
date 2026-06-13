"use client"

import { use } from 'react'
import Link from 'next/link'
import { MailCheck, Eye, LayoutDashboard, FileSearch, CreditCard, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const NEXT_STEPS = [
  {
    icon: FileSearch,
    title: 'We prepare your proof',
    body: 'A print-accurate PDF proof of your mail piece, merged with your list data.',
  },
  {
    icon: Eye,
    title: 'You review & approve',
    body: "Nothing prints until you sign off. Your card is authorized, not charged.",
  },
  {
    icon: CreditCard,
    title: 'Payment captures on approval',
    body: 'Only after you approve the proof do we capture the authorized amount.',
  },
  {
    icon: Send,
    title: 'Your campaign mails',
    body: 'We print, process and hand your letters to USPS. Track it all from your dashboard.',
  },
]

export default function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const shortId = orderId.split('-')[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Hero — the letter is on its way */}
        <div className="text-center">
          <div className="relative mx-auto mb-8 h-24 w-24 animate-in zoom-in-50 duration-500">
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl" aria-hidden />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-400 bg-white shadow-lg">
              <MailCheck className="h-11 w-11 text-amber-500" strokeWidth={2.2} />
            </div>
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-600 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
            Order received
          </p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
            Your letters are in motion
          </h1>
          <p className="mx-auto mb-1 max-w-xl text-gray-600 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
            Order <span className="font-mono font-semibold text-gray-900">#{shortId}</span> has
            been submitted and your payment is securely authorized.
          </p>
          <p className="mx-auto max-w-xl text-gray-600 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
            Here&apos;s what happens next:
          </p>
        </div>

        {/* What happens next */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {NEXT_STEPS.map((step, i) => (
            <Card
              key={step.title}
              className="border-gray-200 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <step.icon className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-600">{i + 1}</span>
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-in fade-in duration-500 delay-700 fill-mode-both">
          <Button asChild size="lg" className="bg-amber-500 text-white hover:bg-amber-600">
            <Link href={`/orders/${orderId}`}>
              <Eye className="mr-2 h-4 w-4" />
              Track this order
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard/orders">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              View all orders
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 animate-in fade-in duration-500 delay-700 fill-mode-both">
          We&apos;ll email you the moment your proof is ready to review.
        </p>
      </div>
    </div>
  )
}
