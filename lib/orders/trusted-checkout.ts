import { createHash } from 'crypto'
import { isMailFormatId } from '@/components/designer/mail-spec'
import { toPricingBreakdown } from './pricing-breakdown'
import { calculatePricing, DEFAULT_PRICING, type MailingOptions, type PricingConfig } from './pricing'
import { parseMailingOptions, pricedMailingDefaults } from './mailing-options'
import {
  evaluateOwnedFinishedJob,
  extractValidationJobId,
  fetchValidationJobById,
  type JobQueryClient,
  type ValidationJobRow,
} from './validation-job'
import { assertCheckoutMetadata, type CheckoutPricingInputs } from '../payments/intent-metadata'

export interface TrustedCheckoutOk {
  ok: true
  total: number
  recordCount: number
  jobId: string
  mailingOptions: MailingOptions
  pricingInputs: CheckoutPricingInputs
  amountCents: number
  quoteRevision: string
  pricing: ReturnType<typeof toPricingBreakdown> & { quoteRevision: string; designRevision: string }
  snapshot: Record<string, unknown>
}

export interface TrustedCheckoutErr {
  ok: false
  status: number
  error: string
}

export type TrustedCheckoutResult = TrustedCheckoutOk | TrustedCheckoutErr

type Loose = Record<string, unknown>
const object = (value: unknown): Loose => value && typeof value === 'object' && !Array.isArray(value) ? value as Loose : {}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex')
type QuoteOptions = { requireDesign?: boolean }

export function evaluateTrustedCheckout(
  job: ValidationJobRow | null,
  userId: string,
  orderState: Loose,
  config: PricingConfig = DEFAULT_PRICING,
  options: QuoteOptions = {},
): TrustedCheckoutResult {
  const selection = object(object(orderState.designAndContent).design ?? orderState.design)
  const artwork = object(selection.designJson)
  const hasArtwork = Boolean(selection.designJson && typeof selection.designJson === 'object' && !Array.isArray(selection.designJson))
  if (options.requireDesign !== false && !hasArtwork) return { ok: false, status: 400, error: 'Complete the design before checkout' }
  const artworkFormat = hasArtwork ? (isMailFormatId(artwork.formatId) ? artwork.formatId : 'letter_8_5x11') : undefined
  const rawOptions = object(orderState.mailingOptions ?? object(orderState.campaignSettings).mailingOptions)
  const parsed = parseMailingOptions({ mailingOptions: { ...rawOptions, mailPieceFormat: rawOptions.mailPieceFormat ?? artworkFormat } })
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error }
  if (artworkFormat && parsed.mailingOptions.mailPieceFormat !== artworkFormat) return { ok: false, status: 400, error: 'Design and mailing formats must match' }

  const jobId = extractValidationJobId(orderState)
  if (!jobId) return { ok: false, status: 400, error: 'Validation job is required' }

  const counted = evaluateOwnedFinishedJob(job, userId)
  if (!counted.ok) return counted
  if (counted.jobId !== jobId) return { ok: false, status: 400, error: 'Validation reference does not match its snapshot' }

  const priced = calculatePricing(parsed.mailingOptions, counted.recordCount, config)
  const amountCents = Math.round(priced.total * 100)
  if (!Number.isSafeInteger(amountCents) || amountCents < (options.requireDesign === false ? 1 : 50)) {
    return { ok: false, status: 400, error: 'Order total is missing or non-positive' }
  }

  const defaults = pricedMailingDefaults(parsed.mailingOptions)
  const designRevision = hash(artwork)
  const quoteRevision = hash({ jobId, recipients: counted.recipients, mailingOptions: parsed.mailingOptions, config, designRevision, contactCard: object(orderState.designAndContent).contactCard ?? orderState.contactCard, campaign: orderState.campaignSettings, campaignOptions: orderState.campaignOptions, campaignConfig: orderState.campaignConfig })
  const pricing = { ...toPricingBreakdown(priced), quoteRevision, designRevision }
  const listData = { useMailingData: true, dataSource: 'manual_entry', totalRecords: counted.recordCount, manualRecords: counted.recipients }
  const validation = { orderId: jobId, totalRecords: counted.totalRecords, deliverableRecords: counted.recordCount, records: counted.recipients }
  const snapshot = { ...orderState, pricing, mailingOptions: parsed.mailingOptions, campaignSettings: { ...object(orderState.campaignSettings), mailingOptions: parsed.mailingOptions }, listData, dataAndMapping: { ...object(orderState.dataAndMapping), listData }, addressValidation: validation, accuzipValidation: validation }
  return {
    ok: true,
    total: priced.total,
    recordCount: counted.recordCount,
    jobId: counted.jobId,
    mailingOptions: parsed.mailingOptions,
    amountCents, quoteRevision, pricing, snapshot,
    pricingInputs: {
      orderType: 'direct_mail',
      serviceLevel: parsed.mailingOptions.serviceLevel,
      recordCount: counted.recordCount,
      mailPieceFormat: defaults.mailPieceFormat,
      paperStock: defaults.paperStock,
      finish: defaults.finish,
      postageType: defaults.postageType,
      postageIncluded: defaults.postageIncluded,
      serverTotal: priced.total.toFixed(2),
      quoteRevision,
    },
  }
}

export async function loadTrustedCheckout(
  supabase: JobQueryClient,
  userId: string,
  orderState: Loose,
  config: PricingConfig = DEFAULT_PRICING,
  options: QuoteOptions = {},
): Promise<TrustedCheckoutResult> {
  const jobId = extractValidationJobId(orderState)
  if (!jobId) return { ok: false, status: 400, error: 'Validation job is required' }
  const job = await fetchValidationJobById(supabase, jobId, userId)
  return evaluateTrustedCheckout(job, userId, orderState, config, options)
}

export function amountsMatchCents(piAmountCents: number, serverTotalDollars: number): boolean {
  return piAmountCents === Math.round(serverTotalDollars * 100)
}

export function checkoutPaymentError(payment: { amount: number; currency: string; capture_method: string; metadata?: Record<string, string> | null }, quote: TrustedCheckoutOk, userId: string): TrustedCheckoutErr | null {
  const metadata = payment.metadata ?? {}
  try {
    assertCheckoutMetadata(metadata)
  } catch {
    return { ok: false, status: 400, error: 'Payment metadata is invalid' }
  }
  if (metadata.user_id !== userId) return { ok: false, status: 403, error: 'Payment does not belong to this account' }
  if (metadata.order_id) return { ok: false, status: 409, error: 'This payment has already been used' }
  if (payment.currency !== 'usd' || payment.capture_method !== 'manual' || payment.amount !== quote.amountCents) return { ok: false, status: 402, error: 'Authorized amount does not match the server quote' }
  if (metadata.quote_revision !== quote.quoteRevision) return { ok: false, status: 409, error: 'Artwork, recipients or options changed. Restart payment.' }
  return null
}
