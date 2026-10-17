import { calculatePricing, DEFAULT_PRICING, type MailingOptions, type PricingConfig } from './pricing'
import { parseMailingOptions, pricedMailingDefaults } from './mailing-options'
import {
  evaluateOwnedFinishedJob,
  extractValidationJobId,
  fetchValidationJobById,
  type JobQueryClient,
  type ValidationJobRow,
} from './validation-job'
import type { CheckoutPricingInputs } from '../payments/intent-metadata'

export interface TrustedCheckoutOk {
  ok: true
  total: number
  recordCount: number
  jobId: string
  mailingOptions: MailingOptions
  pricingInputs: CheckoutPricingInputs
}

export interface TrustedCheckoutErr {
  ok: false
  status: number
  error: string
}

export type TrustedCheckoutResult = TrustedCheckoutOk | TrustedCheckoutErr

type Loose = Record<string, unknown>

export function evaluateTrustedCheckout(
  job: ValidationJobRow | null,
  userId: string,
  orderState: Loose,
  config: PricingConfig = DEFAULT_PRICING
): TrustedCheckoutResult {
  const parsed = parseMailingOptions(orderState)
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error }

  const jobId = extractValidationJobId(orderState)
  if (!jobId) return { ok: false, status: 400, error: 'Validation job is required' }

  const counted = evaluateOwnedFinishedJob(job, userId)
  if (!counted.ok) return counted

  const priced = calculatePricing(parsed.mailingOptions, counted.recordCount, config)
  if (!(priced.total > 0)) {
    return { ok: false, status: 400, error: 'Order total is missing or non-positive' }
  }

  const defaults = pricedMailingDefaults(parsed.mailingOptions)
  return {
    ok: true,
    total: priced.total,
    recordCount: counted.recordCount,
    jobId: counted.jobId,
    mailingOptions: parsed.mailingOptions,
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
    },
  }
}

export async function loadTrustedCheckout(
  supabase: JobQueryClient,
  userId: string,
  orderState: Loose,
  config: PricingConfig = DEFAULT_PRICING
): Promise<TrustedCheckoutResult> {
  const jobId = extractValidationJobId(orderState)
  if (!jobId) return { ok: false, status: 400, error: 'Validation job is required' }
  const job = await fetchValidationJobById(supabase, jobId)
  return evaluateTrustedCheckout(job, userId, orderState, config)
}

export function amountsMatchCents(piAmountCents: number, serverTotalDollars: number): boolean {
  return Math.abs(piAmountCents - Math.round(serverTotalDollars * 100)) <= 1
}
