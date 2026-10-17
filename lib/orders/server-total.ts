import { calculatePricing, DEFAULT_PRICING, type MailingOptions, type PricingConfig } from './pricing'
import { extractRecordCount } from './order-insert'

type Loose = Record<string, unknown>

const SERVICE_LEVELS = new Set(['full_service', 'ship_processed', 'print_only'])

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

export function mailingOptionsFromOrderState(orderState: Loose): MailingOptions | null {
  const mailing = (orderState.mailingOptions ??
    (orderState.campaignSettings as { mailingOptions?: unknown } | undefined)?.mailingOptions) as
    | Record<string, unknown>
    | undefined
  if (!mailing || typeof mailing.serviceLevel !== 'string') return null
  if (!SERVICE_LEVELS.has(mailing.serviceLevel)) return null
  return {
    serviceLevel: mailing.serviceLevel as MailingOptions['serviceLevel'],
    mailPieceFormat: mailing.mailPieceFormat as MailingOptions['mailPieceFormat'],
    paperStock: mailing.paperStock as MailingOptions['paperStock'],
    finish: mailing.finish as MailingOptions['finish'],
    postageType: mailing.postageType as MailingOptions['postageType'],
    includePostage: typeof mailing.includePostage === 'boolean' ? mailing.includePostage : undefined,
  }
}

/**
 * Canonical order total from mailing options + deliverable count + DB/default
 * rates. Ignores client `pricing.totalPrice` and client `amount`.
 */
export function computeServerOrderTotal(
  orderState: Loose,
  config: PricingConfig = DEFAULT_PRICING
): ServerTotalResult {
  const mailingOptions = mailingOptionsFromOrderState(orderState)
  if (!mailingOptions) return { ok: false, error: 'Mailing options not configured' }
  const recordCount = extractRecordCount(orderState)
  if (recordCount < 1) return { ok: false, error: 'Record count must be at least 1' }
  const priced = calculatePricing(mailingOptions, recordCount, config)
  if (!(priced.total > 0)) return { ok: false, error: 'Order total is missing or non-positive' }
  return { ok: true, total: priced.total, recordCount, mailingOptions }
}

export function amountsMatchCents(piAmountCents: number, serverTotalDollars: number): boolean {
  return Math.abs(piAmountCents - Math.round(serverTotalDollars * 100)) <= 1
}
