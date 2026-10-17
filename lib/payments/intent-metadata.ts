export interface CheckoutPricingInputs {
  orderType: 'direct_mail'
  serviceLevel: string
  recordCount: number
  mailPieceFormat: string
  paperStock: string
  finish: string
  postageType: string
  postageIncluded: boolean
  serverTotal: string
}

const META_KEYS = [
  'user_id',
  'order_type',
  'service_level',
  'record_count',
  'mail_piece_format',
  'paper_stock',
  'finish',
  'postage_type',
  'postage_included',
  'server_total',
  'order_id',
] as const

export function stripeCheckoutMetadata(
  userId: string,
  inputs: CheckoutPricingInputs,
  orderId?: string
): Record<string, string> {
  const metadata: Record<string, string> = {
    user_id: userId,
    order_type: inputs.orderType,
    service_level: inputs.serviceLevel,
    record_count: String(inputs.recordCount),
    mail_piece_format: inputs.mailPieceFormat,
    paper_stock: inputs.paperStock,
    finish: inputs.finish,
    postage_type: inputs.postageType,
    postage_included: inputs.postageIncluded ? 'true' : 'false',
    server_total: inputs.serverTotal,
  }
  if (orderId) metadata.order_id = orderId
  return metadata
}

export function assertCheckoutMetadata(metadata: Record<string, string>): void {
  for (const key of Object.keys(metadata)) {
    if (!META_KEYS.includes(key as (typeof META_KEYS)[number])) {
      throw new Error(`Unexpected PaymentIntent metadata key: ${key}`)
    }
  }
}
