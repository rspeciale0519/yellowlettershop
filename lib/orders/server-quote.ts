import { createHash } from 'crypto'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { calculatePricing, type PricingConfig } from './pricing'
import { toPricingBreakdown } from './pricing-breakdown'
import { isMailFormatId } from '@/components/designer/mail-spec'

export class QuoteError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const mailingSchema = z.object({
  serviceLevel: z.enum(['full_service','ship_processed','print_only']),
  mailPieceFormat: z.enum(['postcard_4x6','postcard_5x7','letter_8_5x11','letter_folded']).default('postcard_4x6'),
  paperStock: z.enum(['standard_14pt','premium_16pt','luxury_18pt']).optional(),
  finish: z.enum(['matte','gloss','uv_coating']).optional(),
  postageType: z.enum(['first_class_forever','first_class_discounted','standard']).optional(),
  includePostage: z.boolean().optional(),
})
const recipientSchema = z.object({
  is_deliverable: z.boolean(),
  standardized_address: z.object({ address_line_1: z.string().min(1), address_line_2: z.string().optional(), city: z.string().min(1), state: z.string().min(1), zip: z.string().min(1) }),
}).passthrough()
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex')

/** Main's existing artwork/pricing model; only server-owned validated recipients determine quantity. */
export async function loadOrderQuote(db: SupabaseClient, userId: string, state: Record<string, unknown>, config: PricingConfig) {
  const ids = [...new Set([state.addressValidation, state.accuzipValidation].flatMap(v => [object(v).orderId, object(v).jobId]).filter(v => typeof v === 'string' && v))]
  if (ids.length !== 1) throw new QuoteError('Complete address validation before checkout; one validation reference is required')
  const { data: job, error } = await db.from('accuzip_validation_jobs')
    .select('id, user_id, status, deliverable_count, validated_records').eq('id', ids[0]).eq('user_id', userId).eq('status', 'completed').single()
  if (error || !job || job.user_id !== userId || job.status !== 'completed') throw new QuoteError('Completed address validation not found', 404)
  const records = z.array(z.object({ is_deliverable: z.boolean() }).passthrough()).parse(job.validated_records)
  const recipients = records.filter(record => record.is_deliverable).map(raw => {
    const record = recipientSchema.parse(raw)
    return { ...record, ...record.standardized_address, zip_code: record.standardized_address.zip }
  })
  if (!recipients.length || recipients.length !== job.deliverable_count) throw new QuoteError('Validation count does not match its recipient snapshot')
  const selection = object(object(state.designAndContent).design ?? state.design)
  if (!selection.designJson || typeof selection.designJson !== 'object' || Array.isArray(selection.designJson)) throw new QuoteError('Complete the design before checkout')
  const artwork = object(selection.designJson)
  const format = isMailFormatId(artwork.formatId) ? artwork.formatId : 'letter_8_5x11'
  const options = object(state.mailingOptions ?? object(state.campaignSettings).mailingOptions)
  const mailingOptions = mailingSchema.parse({ ...options, mailPieceFormat: options.mailPieceFormat ?? format })
  if (format !== mailingOptions.mailPieceFormat) throw new QuoteError('Design and mailing formats must match')
  const result = calculatePricing(mailingOptions, recipients.length, config)
  const amountCents = Math.round(result.total * 100)
  if (!Number.isSafeInteger(amountCents) || amountCents < 50) throw new QuoteError('Invalid server-calculated order amount')
  const designRevision = hash(artwork)
  const quoteRevision = hash({ jobId: job.id, recipients, mailingOptions, config, designRevision, contactCard: object(state.designAndContent).contactCard ?? state.contactCard, campaign: state.campaignSettings, campaignOptions: state.campaignOptions, campaignConfig: state.campaignConfig })
  const pricing = { ...toPricingBreakdown(result), quoteRevision, designRevision }
  const listData = { useMailingData: true, dataSource: 'manual_entry', totalRecords: recipients.length, manualRecords: recipients }
  const validation = { orderId: job.id, deliverableRecords: recipients.length, totalRecords: records.length, records: recipients }
  const snapshot = {
    ...state, pricing, mailingOptions,
    campaignSettings: { ...object(state.campaignSettings), mailingOptions },
    listData, dataAndMapping: { ...object(state.dataAndMapping), listData },
    addressValidation: validation, accuzipValidation: validation,
  }
  return { result, pricing, snapshot, amountCents }
}
export type ServerOrderQuote = Awaited<ReturnType<typeof loadOrderQuote>>
export function assertQuotePayment(payment: { amount: number; currency: string; capture_method: string; metadata: Record<string, string> }, quote: ServerOrderQuote, userId: string) {
  if (payment.metadata.user_id !== userId) throw new QuoteError('Payment does not belong to this account', 403)
  if (payment.currency !== 'usd' || payment.capture_method !== 'manual' || payment.amount !== quote.amountCents) throw new QuoteError('Authorized amount does not match the server quote', 402)
  if (payment.metadata.quote_revision !== quote.pricing.quoteRevision) throw new QuoteError('Artwork, recipients or options changed. Restart payment.', 409)
}
