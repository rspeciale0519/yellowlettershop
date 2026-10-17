/** Public homepage rates, in integer cents per piece. Mailed columns include postage. */
export const PUBLISHED_PRICING_SOURCE = {
  url: 'https://yellowlettershop.com/',
  retrievedAt: '2026-10-17',
  effectiveFrom: '2026-07-12',
} as const

export const PUBLISHED_QUANTITY_BANDS: readonly { min: number; max: number | null; label: string }[] = [
  { min: 1, max: 249, label: '1 - 249' },
  { min: 250, max: 499, label: '250 - 499' },
  { min: 500, max: 749, label: '500 - 749' },
  { min: 750, max: 999, label: '750 - 999' },
  { min: 1000, max: 2499, label: '1,000 - 2,499' },
  { min: 2500, max: 4999, label: '2,500 - 4,999' },
  { min: 5000, max: 9999, label: '5,000 - 9,999' },
  { min: 10000, max: null, label: '10,000+' },
]

export type PublishedLetterService = 'mailed_sc' | 'mailed_fc' | 'shipped_fc' | 'shipped_np' | 'shipped_po'
export const PUBLISHED_LETTER_RATES: Record<PublishedLetterService, readonly number[]> = {
  mailed_sc: [115, 110, 107, 102, 92, 91, 88, 85],
  mailed_fc: [170, 165, 143, 136, 123, 121, 117, 114],
  shipped_fc: [170, 165, 160, 153, 137, 135, 131, 128],
  shipped_np: [65, 65, 65, 65, 65, 65, 65, 65],
  shipped_po: [55, 55, 55, 55, 55, 55, 55, 55],
}

export const PUBLISHED_POSTCARD_RATES: readonly {
  format: 'postcard_4x6' | 'postcard_5x7' | 'postcard_6x9' | 'postcard_6x11'
  postageClass: 'fc' | 'sc'
  label: string
  rates: readonly number[]
}[] = [
  { format: 'postcard_4x6', postageClass: 'fc', label: '4 × 6 (FC)', rates: [125, 91, 88, 84, 76, 75, 72, 70] },
  { format: 'postcard_4x6', postageClass: 'sc', label: '4 × 6 (SC)', rates: [125, 92, 89, 85, 77, 76, 73, 71] },
  { format: 'postcard_5x7', postageClass: 'fc', label: '5 × 7 (FC)', rates: [127, 98, 95, 91, 82, 81, 78, 76] },
  { format: 'postcard_5x7', postageClass: 'sc', label: '5 × 7 (SC)', rates: [127, 94, 91, 87, 78, 77, 74, 72] },
  { format: 'postcard_6x9', postageClass: 'fc', label: '6 × 9 (FC)', rates: [128, 99, 96, 92, 83, 82, 79, 77] },
  { format: 'postcard_6x9', postageClass: 'sc', label: '6 × 9 (SC)', rates: [128, 95, 92, 88, 79, 78, 75, 74] },
  { format: 'postcard_6x11', postageClass: 'fc', label: '6 × 11 (FC)', rates: [131, 101, 99, 94, 85, 84, 81, 79] },
  { format: 'postcard_6x11', postageClass: 'sc', label: '6 × 11 (SC)', rates: [131, 97, 94, 90, 81, 80, 77, 75] },
]

export function publishedTierIndex(quantity: number): number {
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Quantity must be a positive safe integer')
  return PUBLISHED_QUANTITY_BANDS.findIndex(band => quantity >= band.min && (band.max === null || quantity <= band.max))
}
