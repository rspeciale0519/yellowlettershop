import { MAIL_PIECE_FORMATS, type MailPieceFormat } from './mail-formats'
export interface ProductPrintPolicy {
  includedPrintedSides: number
  allowAdditionalPages: boolean
  additionalPrintedSideCents: 10
}
export function getProductPrintPolicy(format: string): ProductPrintPolicy {
  if (!MAIL_PIECE_FORMATS.includes(format as MailPieceFormat)) throw new Error('Unsupported print format')
  const postcard = format.startsWith('postcard_')
  return { includedPrintedSides: postcard ? 2 : 1, allowAdditionalPages: !postcard, additionalPrintedSideCents: 10 }
}
export function getAdditionalSideChargeCents(sideCount: number, includedSides: number, quantity: number): number {
  if (![sideCount, includedSides, quantity].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Counts must be positive safe integers')
  const charge = Math.max(0, sideCount - includedSides) * 10 * quantity
  if (!Number.isSafeInteger(charge)) throw new Error('Additional side charge exceeds supported amount')
  return charge
}
