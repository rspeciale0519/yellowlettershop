import type { PricingResult } from './pricing'
import type { PricingBreakdown } from '@/types/orders'

/**
 * Adapt the pricing engine's PricingResult to the PricingBreakdown shape the
 * order-wizard UI renders (Review + Payment steps). The volume discount is
 * surfaced as a negative add-on line so the itemized list sums to totalPrice.
 */
export function toPricingBreakdown(result: PricingResult): PricingBreakdown {
  const discount = result.discount ?? 0
  const tier = result.breakdown.volumeDiscount

  return {
    basePrice: result.printing,
    addOnServices:
      discount > 0
        ? [
            {
              id: 'volume_discount',
              name: tier
                ? `Volume discount (${tier.percentage}% at ${tier.tier}+)`
                : 'Volume discount',
              description: 'Automatic discount applied to printing at volume',
              unitPrice: -discount,
              quantity: 1,
              totalPrice: -discount,
            },
          ]
        : [],
    postageCharges: result.postage ?? 0,
    shippingCharges: result.shipping ?? 0,
    taxAmount: 0,
    totalPrice: result.total,
    pricePerPiece: result.pricePerPiece,
  }
}
