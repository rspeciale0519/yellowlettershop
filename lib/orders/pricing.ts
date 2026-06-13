// Pricing. Printing/postage/shipping values are in raw units where each unit =
// $0.001 (divide by 1000 for dollars). Volume-discount amounts use cents scaling
// (divide by 100). The constants below are the DEFAULT/fallback; admins can
// override them via the pricing_config table (see lib/orders/pricing-config.ts),
// which is loaded by the pricing API routes and passed into calculatePricing.

export type MailPieceFormat = 'postcard_4x6' | 'postcard_5x7' | 'letter_8_5x11' | 'letter_folded'
export type PaperStock = 'standard_14pt' | 'premium_16pt' | 'luxury_18pt'
export type Finish = 'matte' | 'gloss' | 'uv_coating'
export type PostageType = 'first_class_forever' | 'first_class_discounted' | 'standard'

export interface PricingConfig {
  printing: Record<MailPieceFormat, number>
  paperStock: Record<PaperStock, number>
  finish: Record<Finish, number>
  postage: Record<PostageType, number>
  shipping: {
    ship_processed: { base: number; perPiece: number }
    full_service: { base: number; perPiece: number }
  }
  volumeDiscounts: { minQuantity: number; discount: number }[]
}

export const DEFAULT_PRICING: PricingConfig = {
  printing: {
    postcard_4x6: 45,
    postcard_5x7: 65,
    letter_8_5x11: 75,
    letter_folded: 95,
  },
  paperStock: {
    standard_14pt: 0,
    premium_16pt: 5,
    luxury_18pt: 10,
  },
  finish: {
    matte: 0,
    gloss: 2,
    uv_coating: 5,
  },
  postage: {
    first_class_forever: 73,
    first_class_discounted: 60,
    standard: 25,
  },
  shipping: {
    ship_processed: { base: 1500, perPiece: 2 },
    full_service: { base: 0, perPiece: 0 },
  },
  volumeDiscounts: [
    { minQuantity: 5000, discount: 0.1 },
    { minQuantity: 2500, discount: 0.07 },
    { minQuantity: 1000, discount: 0.05 },
    { minQuantity: 500, discount: 0.03 },
  ],
}

export type MailingOptions = {
  serviceLevel: 'full_service' | 'ship_processed' | 'print_only'
  mailPieceFormat?: MailPieceFormat
  paperStock?: PaperStock
  finish?: Finish
  postageType?: PostageType
  includePostage?: boolean
}

export type PricingResult = {
  printing: number
  postage: number | null
  shipping: number | null
  discount: number | null
  total: number
  recordCount: number
  pricePerPiece: number
  breakdown: {
    printingDetails: {
      baseFormat: string | undefined
      baseCost: number
      paperUpcharge: number
      finishUpcharge: number
    }
    volumeDiscount: { tier: number; percentage: number } | null
  }
}

const UNIT = 1000 // raw units → dollars divisor
const DISC = 100 // discount raw units → dollars divisor

export function calculatePricing(
  opts: MailingOptions,
  recordCount: number,
  config: PricingConfig = DEFAULT_PRICING
): PricingResult {
  let printingUnits = 0
  let postageUnits = 0
  let shippingUnits = 0
  let discountUnits = 0

  if (opts.serviceLevel !== 'print_only') {
    const formatCost = config.printing[opts.mailPieceFormat ?? 'postcard_4x6']
    const paperCost = config.paperStock[opts.paperStock ?? 'standard_14pt']
    const finishCost = config.finish[opts.finish ?? 'matte']
    printingUnits = (formatCost + paperCost + finishCost) * recordCount
  } else {
    printingUnits = 2500
  }

  if (opts.serviceLevel === 'full_service' && opts.includePostage && opts.postageType) {
    let rate = config.postage[opts.postageType]
    if ((opts.postageType === 'first_class_discounted' || opts.postageType === 'standard') && recordCount < 200) {
      rate = config.postage.first_class_forever
    }
    postageUnits = rate * recordCount
  }

  if (opts.serviceLevel === 'ship_processed') {
    const s = config.shipping.ship_processed
    shippingUnits = s.base + s.perPiece * recordCount
  }

  const tier = config.volumeDiscounts.find((t) => recordCount >= t.minQuantity)
  if (tier && printingUnits > 0) {
    discountUnits = Math.floor(printingUnits * tier.discount)
  }

  // Convert to dollars: printing/postage/shipping use UNIT divisor,
  // discount uses DISC divisor (per spec: floor(printingUnits * rate) / 100).
  const printingDollars = printingUnits / UNIT
  const postageDollars = postageUnits > 0 ? postageUnits / UNIT : null
  const shippingDollars = shippingUnits > 0 ? shippingUnits / UNIT : null
  const discountDollars = discountUnits > 0 ? discountUnits / DISC : null

  const totalDollars =
    printingDollars + (postageDollars ?? 0) + (shippingDollars ?? 0) - (discountDollars ?? 0)

  return {
    printing: printingDollars,
    postage: postageDollars,
    shipping: shippingDollars,
    discount: discountDollars,
    total: totalDollars,
    recordCount,
    pricePerPiece: totalDollars / recordCount,
    breakdown: {
      printingDetails: {
        baseFormat: opts.mailPieceFormat,
        baseCost: config.printing[opts.mailPieceFormat ?? 'postcard_4x6'] / UNIT,
        paperUpcharge: config.paperStock[opts.paperStock ?? 'standard_14pt'] / UNIT,
        finishUpcharge: config.finish[opts.finish ?? 'matte'] / UNIT,
      },
      volumeDiscount: tier ? { tier: tier.minQuantity, percentage: tier.discount * 100 } : null,
    },
  }
}
