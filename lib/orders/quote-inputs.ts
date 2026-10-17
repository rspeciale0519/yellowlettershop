import { z } from 'zod'
import type { DesignerDocumentV2 } from '../../types/designer-document'
import { getPrintedPages } from '../designer/document/pages'
import { getAdditionalSideChargeCents, type ProductPrintPolicy } from './additional-side-pricing'

export const mailingOptionsSchema = z.object({
  serviceLevel: z.enum(['full_service', 'ship_processed', 'print_only']),
  mailPieceFormat: z.enum(['postcard_4x6', 'postcard_5x7', 'letter_8_5x11', 'letter_folded']).optional(),
  paperStock: z.enum(['standard_14pt', 'premium_16pt', 'luxury_18pt']).optional(),
  finish: z.enum(['matte', 'gloss', 'uv_coating']).optional(),
  postageType: z.enum(['first_class_forever', 'first_class_discounted', 'standard']).optional(),
  includePostage: z.boolean().optional(),
  shippingAddress: z.record(z.string()).optional(),
})
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
export function getMailingOptions(state: Record<string, unknown>) {
  return mailingOptionsSchema.parse(state.mailingOptions ?? asRecord(state.campaignSettings).mailingOptions)
}

/** Quantity is injected by the server from its owned, completed validation job. */
export function resolveOrderQuoteInputs(state: Record<string, unknown>, design: DesignerDocumentV2, policy: ProductPrintPolicy) {
  const mailingOptions = getMailingOptions(state)
  if (mailingOptions.mailPieceFormat && mailingOptions.mailPieceFormat !== design.formatId) throw new Error('Design and mailing formats must match')
  const quantity = z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(state.validatedQuantity)
  const printedSideCount = getPrintedPages(design).length
  if (!policy.allowAdditionalPages && (printedSideCount !== policy.includedPrintedSides || design.pageOrder.length !== policy.includedPrintedSides)) throw new Error('Postcards require exactly two sides')
  return {
    mailingOptions: { ...mailingOptions, mailPieceFormat: mailingOptionsSchema.shape.mailPieceFormat.parse(design.formatId) },
    quantity, printedSideCount, includedPrintedSides: policy.includedPrintedSides,
    additionalPrintedSides: Math.max(0, printedSideCount - policy.includedPrintedSides),
    additionalSideChargeCents: getAdditionalSideChargeCents(printedSideCount, policy.includedPrintedSides, quantity),
  }
}
