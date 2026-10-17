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

  const sideCharge = result.additionalSideChargeCents / 100
  return {
    basePriceLabel: result.postageIncluded ? 'Printing and mailing (postage included)' : 'Base printing',
    postageIncluded: result.postageIncluded ?? false,
    basePrice: result.printing,
    additionalSideChargeCents: result.additionalSideChargeCents,
    printedSideCount: result.printedSideCount,
    includedPrintedSides: result.includedPrintedSides,
    validatedQuantity: result.recordCount,
    addOnServices: [
      ...(sideCharge > 0 ? [{
        id: 'additional_printed_sides',
        name: 'Additional printed sides ($0.10 × extra sides × pieces)',
        description: 'Undiscounted charge per additional printed side per piece',
        unitPrice: 0.1,
        quantity: ((result.printedSideCount ?? 0) - (result.includedPrintedSides ?? 0)) * result.recordCount,
        totalPrice: sideCharge,
      }] : []),
      ...(discount > 0
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
        : []),
    ],
    postageCharges: result.postage ?? 0,
    shippingCharges: result.shipping ?? 0,
    taxAmount: 0,
    totalPrice: result.total,
    pricePerPiece: result.pricePerPiece,
  }
}
