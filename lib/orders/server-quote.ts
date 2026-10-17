import { createHash } from 'crypto'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeDesignerDocument } from '../designer/document/normalize'
import { documentRevision } from '../designer/content-revision'
import { getProductPrintPolicy } from './additional-side-pricing'
import { asRecord, getMailingOptions, resolveOrderQuoteInputs } from './quote-inputs'
import { calculatePricing, PricingNotConfiguredError, type PricingConfig } from './pricing'
import { toPricingBreakdown } from './pricing-breakdown'

export class QuoteError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
const stringId = (value: unknown): string | undefined => typeof value === 'string' && value && !value.startsWith('local-') ? value : undefined
function uniqueReference(values: unknown[], label: string) {
  const ids = [...new Set(values.map(stringId).filter((value): value is string => Boolean(value)))]
  if (ids.length > 1) throw new QuoteError(`Conflicting ${label} references`)
  return ids[0]
}
export function getQuoteReferences(state: Record<string, unknown>) {
  const designs = [asRecord(asRecord(state.designAndContent).design), asRecord(state.design)]
  const validations = [asRecord(state.addressValidation), asRecord(state.accuzipValidation)]
  return {
    designId: uniqueReference(designs.flatMap(design => [design.designId, asRecord(design.designJson).designId]), 'design'),
    jobId: uniqueReference(validations.flatMap(validation => [validation.orderId, validation.jobId]), 'validation'),
  }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([key,v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
const validatedRecordSchema = z.object({
  is_deliverable: z.boolean(),
  standardized_address: z.object({ address_line_1: z.string().min(1), address_line_2: z.string().optional(), city: z.string().min(1), state: z.string().min(1), zip: z.string().min(1) }),
}).passthrough()

/** All recipient and design reads are explicitly owner-scoped despite service-role access. */
export async function loadOrderQuote(db: SupabaseClient, userId: string, state: Record<string, unknown>, config: PricingConfig) {
  const { designId, jobId } = getQuoteReferences(state)
  if (!designId || !jobId) throw new QuoteError('Save the design and complete address validation before checkout')
  const [saved, validation] = await Promise.all([
    db.from('saved_designs').select('id, user_id, design_data, updated_at').eq('id', designId).eq('user_id', userId).single(),
    db.from('accuzip_validation_jobs').select('id, user_id, status, deliverable_count, validated_records').eq('id', jobId).eq('user_id', userId).eq('status', 'completed').single(),
  ])
  if (saved.error || !saved.data || saved.data.user_id !== userId) throw new QuoteError('Saved design not found', 404)
  if (validation.error || !validation.data || validation.data.user_id !== userId || validation.data.status !== 'completed') throw new QuoteError('Completed address validation not found', 404)
  const design = normalizeDesignerDocument({ ...asRecord(saved.data.design_data), updatedAt: asRecord(saved.data.design_data).updatedAt ?? saved.data.updated_at, designId })
  const records = z.array(z.object({ is_deliverable: z.boolean() }).passthrough()).parse(validation.data.validated_records)
  const recipients = records.filter(record => record.is_deliverable).map(raw => {
    const record = validatedRecordSchema.parse(raw)
    return { ...record, ...record.standardized_address, zip_code: record.standardized_address.zip }
  })
  if (recipients.length !== validation.data.deliverable_count) throw new QuoteError('Validation count does not match its recipient snapshot')
  const policy = getProductPrintPolicy(design.formatId!)
  const inputs = resolveOrderQuoteInputs({ ...state, validatedQuantity: recipients.length }, design, policy)
  let result: ReturnType<typeof calculatePricing>
  try { result = calculatePricing(inputs.mailingOptions, inputs.quantity, config, inputs) }
  catch (error) {
    if (error instanceof PricingNotConfiguredError) throw new QuoteError(error.message, 422)
    throw error
  }
  const designRevision = await documentRevision(design)
  for (const candidate of [asRecord(asRecord(state.designAndContent).design), asRecord(state.design)]) {
    if ((candidate.designRevision && candidate.designRevision !== designRevision) || (candidate.designJson && await documentRevision(candidate.designJson) !== designRevision)) throw new QuoteError('The design has changed. Save the current artwork before quoting.', 409)
  }
  const contactCard = asRecord(state.designAndContent).contactCard ?? state.contactCard ?? null
  const campaign = { ...asRecord(state.campaignSettings), mailingOptions: inputs.mailingOptions, campaignOptions: asRecord(state.campaignSettings).campaignOptions ?? state.campaignOptions, campaignConfig: state.campaignConfig ?? asRecord(state.campaignSettings).campaignConfig }
  const quoteRevision = createHash('sha256').update(canonical({ designId, designRevision, jobId, recipients, mailingOptions: inputs.mailingOptions, contactCard, campaign, config, policy, amount: result.total })).digest('hex')
  const pricing = { ...toPricingBreakdown(result), quoteStatus: 'final' as const, quoteRevision, designRevision, additionalPrintedSides: inputs.additionalPrintedSides }
  const designSelection = { ...asRecord(asRecord(state.designAndContent).design ?? state.design), designId, designRevision, designJson: design }
  const listData = { useMailingData: true, dataSource: 'manual_entry', totalRecords: inputs.quantity, manualRecords: recipients }
  const validationSnapshot = { orderId: jobId, deliverableRecords: inputs.quantity, totalRecords: records.length, records: recipients }
  // Overwrite BOTH generations: downstream proof/fulfillment cannot select client recipients or artwork.
  const snapshot = {
    ...state, pricing, mailingOptions: inputs.mailingOptions, design: designSelection,
    designAndContent: { ...asRecord(state.designAndContent), design: designSelection },
    campaignSettings: { ...asRecord(state.campaignSettings), mailingOptions: inputs.mailingOptions },
    listData, dataAndMapping: { ...asRecord(state.dataAndMapping), listData },
    addressValidation: validationSnapshot, accuzipValidation: validationSnapshot,
  }
  return { pricing, result, snapshot, amountCents: Math.round(result.total * 100) }
}
export type ServerOrderQuote = Awaited<ReturnType<typeof loadOrderQuote>>
export function assertQuotePayment(payment: { amount: number; currency: string; capture_method: string; metadata: Record<string, string> }, quote: ServerOrderQuote, userId: string) {
  if (payment.metadata.user_id !== userId) throw new QuoteError('Payment does not belong to this account', 403)
  if (payment.currency !== 'usd' || payment.capture_method !== 'manual' || payment.amount !== quote.amountCents) throw new QuoteError('Authorized amount does not match the server quote', 402)
  if (payment.metadata.quote_revision !== quote.pricing.quoteRevision) throw new QuoteError('The artwork, recipients or options changed. Refresh the quote and restart payment.', 409)
}

/** Legacy wizard callers may estimate before saving/validation; never accepted by payment routes. */
export function provisionalOrderQuote(state: Record<string, unknown>, config: PricingConfig) {
  const validation = asRecord(state.addressValidation ?? state.accuzipValidation)
  const list = asRecord(asRecord(state.dataAndMapping).listData ?? state.listData)
  const count = validation.deliverableRecords ?? list.totalRecords ?? (Array.isArray(list.manualRecords) ? list.manualRecords.length : 0)
  const quantity = z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(count)
  const candidate = asRecord(asRecord(state.designAndContent).design ?? state.design).designJson
  const design = candidate ? normalizeDesignerDocument(candidate) : undefined
  const sides = design ? resolveOrderQuoteInputs({ ...state, validatedQuantity: quantity }, design, getProductPrintPolicy(design.formatId!)) : undefined
  const result = calculatePricing(sides?.mailingOptions ?? getMailingOptions(state), quantity, config, sides)
  return { result: { ...result, quoteStatus: 'provisional' as const }, pricing: { ...toPricingBreakdown(result), quoteStatus: 'provisional' as const } }
}
