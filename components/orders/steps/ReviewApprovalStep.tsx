'use client'
import type { OrderStepProps, OrderApproval } from '../../../types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
import { Label } from '../../ui/label'
import { Alert, AlertDescription } from '../../ui/alert'
import { useOrderWorkflow } from '../OrderProvider'
import { useOrderQuote } from '../quotes/use-order-quote'
import { useOrderProof } from '../quotes/use-order-proof'
import { OrderReviewDetails } from '../quotes/order-review-details'
import { OrderQuoteSummary } from '../quotes/order-quote-summary'
import { approvalMatchesQuote, isFinalOrderQuote } from '../../../lib/orders/quote-state'

export function ReviewApprovalStep({ orderState }: OrderStepProps) {
  const { updateOrderState } = useOrderWorkflow()
  const quote = useOrderQuote(orderState, updateOrderState)
  const proof = useOrderProof(orderState, quote.pricing, updateOrderState)
  const readyToApprove = isFinalOrderQuote(quote.pricing) && !quote.isLoading && Boolean(proof.url) && !proof.isLoading
  const approved = readyToApprove && approvalMatchesQuote(orderState.approval, quote.pricing)
  const handleApprovalChange = (field: 'designLocked' | 'termsAccepted', value: boolean) => {
    if (!readyToApprove) return
    const approval: OrderApproval = {
      designLocked: false, termsAccepted: false, approvedBy: 'current_user',
      ...orderState.approval, [field]: value, approvedAt: value ? new Date() : undefined,
      quoteRevision: quote.pricing!.quoteRevision,
    }
    updateOrderState({ approval }, quote.key)
  }
  return <div className="max-w-4xl mx-auto space-y-6">
    <div className="text-center"><h2 className="text-3xl font-bold">Review &amp; Approval</h2><p>Review your order details and approve the current proof.</p></div>
    <OrderReviewDetails state={orderState} pricing={quote.pricing} />
    <OrderQuoteSummary pricing={quote.pricing} isLoading={quote.isLoading} error={quote.error} onRetry={quote.refresh} />
    <Card><CardHeader><CardTitle>Design Proof</CardTitle></CardHeader><CardContent className="space-y-3" aria-live="polite">
      {proof.isLoading ? <p role="status">Generating the current proof…</p> : proof.url ? <>
        <p>Proof matches the current saved artwork and validated recipients.</p>
        <iframe title="Order design proof" src={proof.url} className="w-full h-[32rem] border rounded-md" />
        <Button variant="outline" onClick={() => window.open(proof.url, '_blank', 'noopener,noreferrer')}>View proof</Button>
        <a href={proof.url} target="_blank" rel="noopener noreferrer" download>Download proof</a>
      </> : <p>{proof.error ?? 'A final quote is required before generating the proof.'}</p>}
      {proof.error && <Button variant="outline" onClick={quote.refresh}>Refresh quote and proof</Button>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Final Approval</CardTitle></CardHeader><CardContent className="space-y-5">
      <div className="flex items-start gap-3"><Checkbox id="design-locked" disabled={!readyToApprove} checked={readyToApprove && Boolean(orderState.approval?.designLocked)} onCheckedChange={checked => handleApprovalChange('designLocked', checked === true)} /><Label htmlFor="design-locked">I approve this design. Once I continue, it is locked for production and cannot be changed.</Label></div>
      <p className="text-sm text-gray-600">Please review the proof above carefully before checking this box.</p>
      <div className="flex items-start gap-3"><Checkbox id="terms-accepted" disabled={!readyToApprove} checked={readyToApprove && Boolean(orderState.approval?.termsAccepted)} onCheckedChange={checked => handleApprovalChange('termsAccepted', checked === true)} /><Label htmlFor="terms-accepted">I accept the Terms of Service and Privacy Policy, and I understand that all orders are non-refundable.</Label></div>
      <p className="text-sm text-gray-600">Your mailing list data is handled according to our Privacy Policy.</p>
    </CardContent></Card>
    <Alert><AlertDescription>{approved ? 'Your current quote and proof are approved. Continue to secure payment.' : 'Wait for the final quote and current proof, then confirm both approval items.'}</AlertDescription></Alert>
  </div>
}
