import type { OrderState, PricingBreakdown, PaymentData, OrderApproval } from '../../types/orders'
import { canonicalDocumentContent } from '../designer/content-revision'

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (typeof File !== 'undefined' && value instanceof File) return { name: value.name, size: value.size, lastModified: value.lastModified }
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)]))
  return value
}
function designInputs(design: OrderState['design']) {
  if (!design) return undefined
  let content: unknown = design.designJson
  try { content = canonicalDocumentContent(content) } catch { /* Keep invalid drafts distinct, so they cannot retain a prior quote. */ }
  return { designId: design.designId, designRevision: design.designRevision, content }
}
/** Excludes server results and navigation/save metadata to avoid quote/refetch loops. */
export function orderQuoteKey(state: OrderState): string {
  return JSON.stringify(canonical({
    design: designInputs(state.designAndContent?.design ?? state.design),
    list: state.dataAndMapping?.listData ?? state.listData,
    mapping: state.dataAndMapping?.columnMapping ?? state.columnMapping,
    validation: state.addressValidation ?? state.accuzipValidation,
    mailing: state.mailingOptions ?? state.campaignSettings?.mailingOptions,
    contactCard: state.designAndContent?.contactCard ?? state.contactCard,
    campaign: state.campaignSettings?.campaignOptions ?? state.campaignOptions,
  }))
}
export function applyOrderUpdate(state: OrderState, updates: Partial<OrderState>, expectedKey?: string): OrderState {
  if (expectedKey !== undefined && expectedKey !== orderQuoteKey(state)) return state
  const next = { ...state, ...updates, updatedAt: new Date() }
  if ('designAndContent' in updates) {
    next.designAndContent = { design: state.design, contactCard: state.contactCard, ...state.designAndContent, ...updates.designAndContent }
    next.design = next.designAndContent.design
    next.contactCard = next.designAndContent.contactCard
  } else if ('design' in updates || 'contactCard' in updates) next.designAndContent = { ...state.designAndContent, ...('design' in updates ? { design: updates.design } : {}), ...('contactCard' in updates ? { contactCard: updates.contactCard } : {}) }
  if ('mailingOptions' in updates || 'campaignOptions' in updates) next.campaignSettings = { ...state.campaignSettings, ...('mailingOptions' in updates ? { mailingOptions: updates.mailingOptions } : {}), ...('campaignOptions' in updates ? { campaignOptions: updates.campaignOptions } : {}) }
  else if ('campaignSettings' in updates) {
    next.campaignSettings = { mailingOptions: state.mailingOptions, campaignOptions: state.campaignOptions, ...state.campaignSettings, ...updates.campaignSettings }
    next.mailingOptions = next.campaignSettings.mailingOptions
    next.campaignOptions = next.campaignSettings.campaignOptions
  }
  if ('dataAndMapping' in updates) { next.listData = updates.dataAndMapping?.listData; next.columnMapping = updates.dataAndMapping?.columnMapping }
  else if (updates.listData) next.dataAndMapping = { ...state.dataAndMapping, listData: updates.listData, columnMapping: updates.columnMapping ?? state.columnMapping }
  if ('addressValidation' in updates) next.accuzipValidation = updates.addressValidation
  else if ('accuzipValidation' in updates) next.addressValidation = updates.accuzipValidation
  const changed = orderQuoteKey(state) !== orderQuoteKey(next)
  const repriced = 'pricing' in updates && state.pricing?.quoteRevision !== updates.pricing?.quoteRevision
  if (changed) next.pricing = undefined
  if (changed || repriced) { next.payment = undefined; next.approval = undefined; next.proofQuoteRevision = undefined; next.proofPending = false; next.currentStepValid = false }
  return next
}
export function isFinalOrderQuote(pricing: PricingBreakdown | undefined): pricing is PricingBreakdown & { quoteRevision: string; designRevision: string; validatedQuantity: number } {
  return Boolean(pricing?.quoteStatus === 'final' && pricing.quoteRevision && pricing.designRevision && Number.isSafeInteger(pricing.validatedQuantity) && pricing.validatedQuantity! > 0 && Number.isFinite(pricing.totalPrice) && pricing.totalPrice > 0)
}
export function isPaymentForQuote(payment: PaymentData | undefined, pricing: PricingBreakdown | undefined): boolean {
  return Boolean(isFinalOrderQuote(pricing) && payment?.paymentIntentId && payment.quoteRevision === pricing.quoteRevision && payment.currency === 'usd' && Math.round(payment.amount * 100) === Math.round(pricing.totalPrice * 100))
}
export function approvalMatchesQuote(approval: OrderApproval | undefined, pricing: PricingBreakdown | undefined): boolean {
  return Boolean(isFinalOrderQuote(pricing) && approval?.designLocked && approval.termsAccepted && approval.quoteRevision === pricing.quoteRevision)
}
