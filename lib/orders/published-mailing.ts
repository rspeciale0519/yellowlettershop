import { PUBLISHED_LETTER_RATES, PUBLISHED_POSTCARD_RATES, PUBLISHED_QUANTITY_BANDS } from './published-pricing'
import { getAdditionalSideChargeCents } from './additional-side-pricing'
import type { MailingOptions, MailPieceFormat, PricingConfig, PricingResult } from './pricing'

type PublishedProduct = 'letter' | 'postcard_4x6' | 'postcard_5x7' | 'postcard_6x9' | 'postcard_6x11'
export type PublishedMailingKey = `published_${PublishedProduct}_${'fc' | 'sc'}`
export type PublishedRateTier = { min: number; max: number | null; price: number }
export type PublishedMailingRates = Record<PublishedMailingKey, PublishedRateTier[]>

/** Separate keys prevent legacy print-only admin rows from overriding postage-inclusive prices. */
export function createPublishedMailingRates(): PublishedMailingRates {
  const rates = {} as PublishedMailingRates
  const add = (key: PublishedMailingKey, prices: readonly number[]) => {
    rates[key] = PUBLISHED_QUANTITY_BANDS.map((band, index) => ({ min: band.min, max: band.max, price: prices[index] }))
  }
  add('published_letter_fc', PUBLISHED_LETTER_RATES.mailed_fc)
  add('published_letter_sc', PUBLISHED_LETTER_RATES.mailed_sc)
  for (const row of PUBLISHED_POSTCARD_RATES) add(`published_${row.format}_${row.postageClass}`, row.rates)
  return rates
}

export function clonePublishedMailingRates(rates: PublishedMailingRates): PublishedMailingRates {
  return Object.fromEntries(Object.entries(rates).map(([key, tiers]) => [key, tiers.map(tier => ({ ...tier }))])) as PublishedMailingRates
}

/** Full-service mailing always includes postage; postcard minimum is 250, not 200. */
export function normalizeFullServiceOptions<T extends MailingOptions>(options: T, quantity: number): T {
  if (options.serviceLevel !== 'full_service') return options
  const format = options.mailPieceFormat ?? 'postcard_4x6'
  const standardAllowed = !format.startsWith('postcard_') || quantity >= 250
  const postageType = options.postageType === 'standard' && !standardAllowed ? 'first_class_forever' : options.postageType ?? 'first_class_forever'
  return { ...options, includePostage: true, postageType }
}

function productKey(format: MailPieceFormat): PublishedProduct {
  if (format === 'letter_8_5x11' || format === 'letter_folded') return 'letter'
  if (PUBLISHED_POSTCARD_RATES.some(row => row.format === format)) return format as Exclude<PublishedProduct, 'letter'>
  throw new Error(`Published mailing pricing is not configured for ${format}`)
}

/** Admin overrides must cover every quantity once, with integer-cent prices. */
export function parsePublishedRateTiers(input: unknown): PublishedRateTier[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Published mailing rates require a complete quantity table')
  const tiers: PublishedRateTier[] = input.map(value => {
    if (!value || typeof value !== 'object') throw new Error('Invalid published mailing tier')
    const row = value as Record<string, unknown>
    if (!Number.isSafeInteger(row.min) || (row.min as number) < 1 || !Number.isSafeInteger(row.price) || (row.price as number) < 0 || (row.max !== null && (!Number.isSafeInteger(row.max) || (row.max as number) < (row.min as number)))) throw new Error('Published mailing tiers require positive quantity bounds and integer cents')
    return { min: row.min as number, max: row.max as number | null, price: row.price as number }
  }).sort((a, b) => a.min - b.min)
  let next = 1
  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index]
    if (tier.min !== next || (tier.max === null && index !== tiers.length - 1)) throw new Error('Published mailing tiers must have no gaps or overlaps')
    next = tier.max === null ? Infinity : tier.max + 1
  }
  if (next !== Infinity) throw new Error('Published mailing tiers must cover all quantities')
  return tiers
}

export function calculatePublishedMailing(
  options: MailingOptions,
  quantity: number,
  config: PricingConfig,
  sides?: { printedSideCount: number; includedPrintedSides: number },
): PricingResult {
  const opts = normalizeFullServiceOptions(options, quantity)
  const format = opts.mailPieceFormat ?? 'postcard_4x6'
  const key: PublishedMailingKey = `published_${productKey(format)}_${opts.postageType === 'standard' ? 'sc' : 'fc'}`
  const tiers = parsePublishedRateTiers(config.publishedMailing[key])
  const tier = tiers.find(row => quantity >= row.min && (row.max === null || quantity <= row.max))
  if (!tier) throw new Error(`Published mailing pricing is not configured for ${key}`)
  const paper = config.paperStock[opts.paperStock ?? 'standard_14pt']
  const finish = config.finish[opts.finish ?? 'matte']
  if (![paper, finish].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid paper or finish upcharge')
  const additionalSideChargeCents = sides ? getAdditionalSideChargeCents(sides.printedSideCount, sides.includedPrintedSides, quantity) : 0
  const baseCents = (tier.price + paper + finish) * quantity
  const totalCents = baseCents + additionalSideChargeCents
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) throw new Error('Invalid pricing total')
  return {
    postageIncluded: true,
    additionalSideChargeCents,
    printedSideCount: sides?.printedSideCount,
    includedPrintedSides: sides?.includedPrintedSides,
    printing: baseCents / 100,
    postage: null,
    shipping: null,
    discount: null,
    total: totalCents / 100,
    recordCount: quantity,
    pricePerPiece: totalCents / quantity / 100,
    breakdown: {
      printingDetails: { baseFormat: format, baseCost: tier.price / 100, paperUpcharge: paper / 100, finishUpcharge: finish / 100 },
      volumeDiscount: null,
    },
  }
}
