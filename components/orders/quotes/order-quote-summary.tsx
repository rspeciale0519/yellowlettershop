'use client'
import type { PricingBreakdown } from '../../../types/orders'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Alert, AlertDescription } from '../../ui/alert'
import { Button } from '../../ui/button'
import { isFinalOrderQuote } from '../../../lib/orders/quote-state'

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
export function OrderQuoteSummary({ pricing, isLoading, error, onRetry }: { pricing?: PricingBreakdown; isLoading: boolean; error?: string | null; onRetry?: () => void }) {
  return <Card aria-live="polite" aria-busy={isLoading}>
    <CardHeader><CardTitle><h3>{isFinalOrderQuote(pricing) ? 'Final quote' : 'Provisional estimate'}</h3></CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {isLoading ? <p role="status">Updating quote…</p> : error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : pricing ? <>
        <p>{pricing.validatedQuantity ?? 0} {isFinalOrderQuote(pricing) ? 'validated pieces' : 'estimated pieces'}{pricing.printedSideCount !== undefined ? ` · ${pricing.printedSideCount} printed sides per piece` : ''}</p>
        {!isFinalOrderQuote(pricing) && <p className="text-sm text-amber-800">Save your design and complete address validation for a final quote before payment.</p>}
        <dl className="space-y-2">
          <div className="flex justify-between gap-4"><dt>{pricing.basePriceLabel ?? 'Base printing'}</dt><dd>{money(pricing.basePrice)}</dd></div>
          {pricing.addOnServices.map(line => <div key={line.id} className="flex justify-between gap-4"><dt>{line.name}</dt><dd>{money(line.totalPrice)}</dd></div>)}
          {pricing.postageCharges > 0 && <div className="flex justify-between"><dt>Postage</dt><dd>{money(pricing.postageCharges)}</dd></div>}
          {pricing.shippingCharges > 0 && <div className="flex justify-between"><dt>Shipping</dt><dd>{money(pricing.shippingCharges)}</dd></div>}
          {pricing.taxAmount > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{money(pricing.taxAmount)}</dd></div>}
          <div className="flex justify-between border-t pt-3 font-bold"><dt>Total</dt><dd>{money(pricing.totalPrice)}</dd></div>
        </dl>
        <p className="text-sm text-gray-600">{money(pricing.pricePerPiece)} per piece</p>
      </> : <p>Select mailing options to estimate your order.</p>}
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry} disabled={isLoading}>Refresh quote</Button>}
    </CardContent>
  </Card>
}
