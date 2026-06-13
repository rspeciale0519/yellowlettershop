"use client"

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Download, Eye, Mail, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ORDER_STATUS_STEPS, statusProgress, type OrderSummary } from '@/lib/orders/order-summary'

interface OrderResponse {
  order: OrderSummary
  statusHistory: Array<{ status: string; at: string }>
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  const [data, setData] = useState<OrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deciding, setDeciding] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  const decide = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !window.confirm('Reject this proof? The order will be parked and no payment captured.')) return
    setDeciding(true)
    setDecisionError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to record your decision')
      await load()
    } catch (e) {
      setDecisionError(e instanceof Error ? e.message : 'Failed to record your decision')
    } finally {
      setDeciding(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Order not found' : 'Failed to load order')
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const order = data?.order
  const progress = order ? statusProgress(order.status) : -1
  const offPath = order && progress === -1
  const historyFor = (status: string) =>
    data?.statusHistory.find((h) => h.status === status)?.at ?? null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-gray-600">
        <Link href="/dashboard/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All orders
        </Link>
      </Button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : order ? (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Order <span className="font-mono">#{order.id.split('-')[0].toUpperCase()}</span>
              </h1>
              <p className="text-sm text-gray-500">Placed {formatDate(order.submittedAt)}</p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Order facts */}
          <Card className="mb-6">
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Total</div>
                <div className="text-lg font-semibold">${order.total.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Mail pieces</div>
                <div className="text-lg font-semibold">{order.recordCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Service</div>
                <div className="text-lg font-semibold capitalize">
                  {order.serviceLevel?.replace(/_/g, ' ') ?? '—'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proof access */}
          {order.proofUrl && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium text-amber-900">Design proof</div>
                    <div className="text-sm text-amber-700">Print-accurate PDF of your mail piece</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={order.proofUrl} target="_blank" rel="noreferrer">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={order.proofUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proof decision — the capture moment */}
          {order.status === 'proof_ready' && (
            <Card className="mb-6 border-2 border-amber-300">
              <CardHeader>
                <CardTitle className="text-base">Approve your proof</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Review the proof above carefully. Approving locks the design for production and
                  captures your authorized payment. Rejecting parks the order — nothing is charged.
                </p>
                {decisionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{decisionError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => decide('approve')}
                    disabled={deciding}
                    className="bg-amber-500 text-white hover:bg-amber-600"
                  >
                    {deciding ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Approve & capture payment
                  </Button>
                  <Button variant="outline" onClick={() => decide('reject')} disabled={deciding}>
                    Reject proof
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Off-path banner */}
          {offPath && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {order.status === 'cancelled'
                  ? 'This order was cancelled. No payment was captured.'
                  : 'The proof was rejected. Our team will follow up, or contact support@yellowlettershop.com.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-0">
                {ORDER_STATUS_STEPS.map((step, i) => {
                  const reached = !offPath && i <= progress
                  const current = !offPath && i === progress
                  const at = historyFor(step.status)
                  const isLast = i === ORDER_STATUS_STEPS.length - 1
                  return (
                    <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                      {!isLast && (
                        <span
                          aria-hidden
                          className={`absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 ${
                            !offPath && i < progress ? 'bg-amber-400' : 'bg-gray-200'
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          reached
                            ? 'border-amber-400 bg-amber-400 text-white'
                            : 'border-gray-200 bg-white text-gray-300'
                        } ${current ? 'ring-4 ring-amber-100' : ''}`}
                      >
                        {reached ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                      </span>
                      <div className="pt-1">
                        <div className={`font-medium ${reached ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </div>
                        {at && <div className="text-xs text-gray-500">{formatDate(at)}</div>}
                        {current && !at && (
                          <div className="text-xs font-medium text-amber-600">Current stage</div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
