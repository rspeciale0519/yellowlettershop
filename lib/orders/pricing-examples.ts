import { calculatePricing, type PricingConfig, type PricingResult } from './pricing'

/** Server-trusted catalog sizes. Query ?recordCount= is ignored. */
export const PRICING_EXAMPLE_COUNTS = {
  postcard_4x6: 500,
  postcard_5x7: 1000,
  letter: 2500,
} as const

export type PricingCatalog = {
  examples: {
    postcard_4x6_500: PricingResult
    postcard_5x7_1000: PricingResult
    letter_2500: PricingResult
  }
}

export function buildPricingCatalog(config: PricingConfig): PricingCatalog {
  return {
    examples: {
      postcard_4x6_500: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_4x6' },
        PRICING_EXAMPLE_COUNTS.postcard_4x6,
        config
      ),
      postcard_5x7_1000: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'postcard_5x7' },
        PRICING_EXAMPLE_COUNTS.postcard_5x7,
        config
      ),
      letter_2500: calculatePricing(
        { serviceLevel: 'full_service', mailPieceFormat: 'letter_8_5x11' },
        PRICING_EXAMPLE_COUNTS.letter,
        config
      ),
    },
  }
}
