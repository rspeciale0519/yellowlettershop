import type { OrderState, PricingBreakdown } from '../../types/orders'
import { artwork } from './quote-fixtures'
export const finalPricing: PricingBreakdown = { basePrice: 75, addOnServices: [], postageCharges: 0, shippingCharges: 0, taxAmount: 0, totalPrice: 85, pricePerPiece: 0.85, quoteStatus: 'final', quoteRevision: 'quote-a', designRevision: 'sha256:art', validatedQuantity: 100, additionalSideChargeCents: 1000 }
export function orderFixture(): OrderState {
  return { proofQuoteRevision: 'quote-a', step: 6, totalSteps: 6, currentStepValid: true, listData: { useMailingData: true }, design: { designId: 'saved', designRevision: 'sha256:art', designJson: artwork(true), variablesUsed: [], isCustomDesign: true }, mailingOptions: { serviceLevel: 'full_service', includePostage: false, mailPieceFormat: 'letter_8_5x11' }, isDraft: true, entryPoint: 'dashboard_create_new', validationErrors: {}, createdAt: new Date(0), updatedAt: new Date(0), pricing: finalPricing, approval: { designLocked: true, termsAccepted: true, approvedBy: 'owner', quoteRevision: 'quote-a' }, payment: { status: 'authorized', amount: 85, currency: 'usd', quoteRevision: 'quote-a', paymentIntentId: 'pi-a' } }
}
