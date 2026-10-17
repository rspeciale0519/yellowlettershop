'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OrderStepProps } from '../../../types/orders'
import { Button } from '../../ui/button'
import { Alert, AlertDescription } from '../../ui/alert'
import { useToast } from '../../ui/use-toast'
import { useOrderWorkflow } from '../OrderProvider'
import { PaymentSecurityInfo } from './payment/PaymentSecurityInfo'
import { PaymentMethodList } from './payment/PaymentMethodList'
import { AddPaymentMethodDialog } from './payment/AddPaymentMethodDialog'
import { ConfirmActionDialog } from '../confirm-action-dialog'
import { useOrderQuote } from '../quotes/use-order-quote'
import { useQuotedIntent } from '../quotes/use-quoted-intent'
import { usePaymentMethods } from '../quotes/use-payment-methods'
import { OrderQuoteSummary } from '../quotes/order-quote-summary'
import { authorizeQuotedOrder, type AuthorizationResult } from '../quotes/authorize-quoted-order'
import { requestJson } from '../quotes/request-json'
import { approvalMatchesQuote, isPaymentForQuote } from '../../../lib/orders/quote-state'

async function completeCardAction(clientSecret: string): Promise<boolean> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!publishableKey) throw new Error('Card authentication is unavailable. Please contact support.')
  const { loadStripe } = await import('@stripe/stripe-js')
  const stripe = await loadStripe(publishableKey)
  if (!stripe) throw new Error('Unable to load card authentication. Please try again.')
  const result = await stripe.handleNextAction({ clientSecret })
  if (result.error) throw new Error(result.error.message ?? 'Card authentication failed')
  return result.paymentIntent?.status === 'requires_capture'
}
export function PaymentStep({ orderState }: OrderStepProps) {
  const { updateOrderState, submitOrder, goToStep } = useOrderWorkflow()
  const router = useRouter()
  const { toast } = useToast()
  const quote = useOrderQuote(orderState, updateOrderState)
  const intent = useQuotedIntent(orderState, quote.pricing, updateOrderState, quote.acceptPricing)
  const cards = usePaymentMethods()
  const [isProcessing, setProcessing] = useState(false)
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const approved = approvalMatchesQuote(orderState.approval, quote.pricing) && orderState.proofQuoteRevision === quote.pricing?.quoteRevision && !orderState.proofPending
  const ready = Boolean(cards.selectedId && !quote.isLoading && !intent.isLoading && approved && isPaymentForQuote(intent.payment, quote.pricing))
  const latest = useRef({ key: quote.key, revision: quote.pricing?.quoteRevision, ready })
  latest.current = { key: quote.key, revision: quote.pricing?.quoteRevision, ready }
  const authorize = async () => {
    if (!ready || !intent.payment || !cards.selectedId || !quote.pricing || isProcessing) return
    const key = quote.key; const revision = quote.pricing.quoteRevision
    setProcessing(true); setError(null); setConfirmOpen(false)
    try {
      const result = await authorizeQuotedOrder({
        state: { ...orderState, pricing: quote.pricing }, payment: intent.payment, methodId: cards.selectedId,
        isCurrent: () => latest.current.key === key && latest.current.revision === revision && latest.current.ready,
        authorize: body => requestJson<AuthorizationResult>('/api/payments/authorize', body),
        completeAction: completeCardAction, update: updateOrderState, submit: submitOrder,
      })
      toast({ title: 'Order submitted', description: 'Your card is authorized. Review the official proof before it is charged.' })
      router.push(`/orders/${result.orderId}/success`)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to authorize payment.')
      quote.refresh()
    } finally { setProcessing(false) }
  }
  const amount = quote.pricing?.totalPrice ?? 0
  const formattedAmount = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  const selectedCard = cards.methods.find(card => card.id === cards.selectedId)
  return <div className="max-w-4xl mx-auto space-y-6">
    <div className="text-center"><h2 className="text-3xl font-bold">Secure Payment</h2><p>Authorize your final quoted amount and submit your order.</p></div>
    <OrderQuoteSummary pricing={quote.pricing} isLoading={quote.isLoading} error={quote.error} onRetry={quote.refresh} />
    {!approved && <Alert><AlertDescription>Review and approve the current final quote and proof before payment. <Button variant="link" onClick={() => goToStep(5)}>Return to review</Button></AlertDescription></Alert>}
    <PaymentMethodList methods={cards.methods} selectedId={cards.selectedId} isLoading={cards.isLoading} onSelect={cards.setSelectedId} onAddNew={() => setAddCardOpen(true)} />
    <AddPaymentMethodDialog open={addCardOpen} onOpenChange={setAddCardOpen} onAdded={async id => { await cards.reload(); cards.setSelectedId(id) }} />
    <PaymentSecurityInfo />
    {(error || intent.error || cards.error) && <Alert variant="destructive"><AlertDescription>{error ?? intent.error ?? cards.error}</AlertDescription></Alert>}
    {intent.isLoading && <p role="status">Preparing payment for the current quote…</p>}
    <Button size="lg" disabled={!ready || isProcessing} onClick={() => setConfirmOpen(true)}>{isProcessing ? 'Processing…' : 'Authorize Payment & Submit Order'}</Button>
    {ready && <p className="text-sm text-gray-600">Authorizing {formattedAmount}. Your card is charged only after proof approval.</p>}
    <ConfirmActionDialog open={confirmOpen && ready} onOpenChange={setConfirmOpen} title="Place a hold and submit your order?" amount={amount} amountCaption={`Held on ${selectedCard ? `${selectedCard.brand.toUpperCase()} ····${selectedCard.last4}` : 'your card'} — not charged yet`} description="We reserve this amount on your card and prepare your official proof. You are charged after you approve that proof." consequences={['Your card is authorized, not charged.', 'We generate your proof and email you when it is ready.', 'Nothing is printed or mailed until you approve it.']} confirmLabel={`Authorize ${formattedAmount} hold`} isPending={isProcessing} onConfirm={() => { void authorize() }} />
  </div>
}
