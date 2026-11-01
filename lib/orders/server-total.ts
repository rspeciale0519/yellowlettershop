import { calculatePricing, DEFAULT_PRICING, type MailingOptions, type PricingConfig } from './pricing'
import { parseMailingOptions } from './mailing-options'

export interface ServerTotalOk {
  ok: true
  total: number
  recordCount: number
  mailingOptions: MailingOptions
}

export interface ServerTotalErr {
  ok: false
  error: string
}

export type ServerTotalResult = ServerTotalOk | ServerTotalErr

export function mailingOptionsFromOrderState(
  orderState: Record<string, unknown>
): MailingOptions | null {
  const parsed = parseMailingOptions(orderState)
  return parsed.ok ? parsed.mailingOptions : null
}

/**
 * Canonical order total from mailing options + a trusted record count
 * (validation-job deliverable_count) + DB/default rates.
 * Never reads client `pricing.totalPrice`, client `amount`, or client counts.
 */
export function computeServerOrderTotal(
  orderState: Record<string, unknown>,
  config: PricingConfig = DEFAULT_PRICING,
  trustedRecordCount?: number
): ServerTotalResult {
  const mailingOptions = mailingOptionsFromOrderState(orderState)
  if (!mailingOptions) return { ok: false, error: 'Mailing options not configured' }
  if (trustedRecordCount === undefined || trustedRecordCount < 1) {
    return { ok: false, error: 'Record count must be at least 1' }
  }
  const priced = calculatePricing(mailingOptions, trustedRecordCount, config)
  if (!(priced.total > 0)) return { ok: false, error: 'Order total is missing or non-positive' }
  return { ok: true, total: priced.total, recordCount: trustedRecordCount, mailingOptions }
}

export { amountsMatchCents } from './trusted-checkout'
